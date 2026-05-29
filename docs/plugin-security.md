# Plugin security

How Verql limits the blast radius of third-party plugins, what it does **not**
defend against today, and what plugin authors and users need to know. Read
[`architecture.md`](./architecture.md) for the plugin model first, then
[`plugins.md`](./plugins.md) for the contribution surfaces. This doc is the
source of truth for the **trust boundary**.

> **One-line summary.** Plugins are ordinary Node modules loaded into the main
> process, so a hostile plugin has the Node API at its disposal. Verql's
> defences are *defence in depth* — explicit capability declaration,
> deny-by-default user consent, hard gating of the sensitive host-provided
> surfaces, and install-time hardening — not an OS sandbox. The honest fix for
> true isolation (process separation) is on the roadmap below.

## Trust model

There are two classes of plugin, and they are treated very differently:

| Class | Where it comes from | `path` | Trust |
|-------|--------------------|--------|-------|
| **Bundled** | Shipped inside the app bundle (`src/main/plugins/bundled/`) — the native drivers, `db-tools`, `ai`, `core-formats`, `core-themes`, `ssh-tunnel`, etc. | `'<bundled>'` | **Trusted.** Every capability is implicitly granted; gating is bypassed. |
| **Third-party** | Installed by the user into `userData/plugins/` | a real path | **Untrusted.** Deny-by-default; only granted capabilities work. |

The distinction is made in exactly one place — `plugin.path === '<bundled>'`
in `plugin-host.ts` — and flows into `createPluginContext` as the `trusted`
flag. There is no in-between: a plugin a user dropped on disk is never trusted,
even if it shares a name with a bundled one (see *Name shadowing* below).

## What a plugin can reach

A plugin's only **sanctioned** interface is the `PluginContext` it receives in
`activate(ctx)` (see [`sdk/types.ts`](../src/main/plugins/sdk/types.ts)). The
surfaces split into three risk tiers:

- **Sensitive, enforced** — gated behind a permission grant:
  - `ctx.keyring` — read/write stored DB passwords and API keys.
  - `ctx.connections` — read connection profiles and run queries on live
    connections.
  - `ctx.ipc` — register arbitrary main-process IPC channels the renderer can call.
- **Trusted-only** — never available to third-party plugins at all:
  - `ctx.rootSettings` — raw, un-namespaced app settings (AI provider config,
    MCP token, …). Untrusted plugins get a throwing shim; they must use their
    own namespaced `ctx.settings` instead.
- **Ungated** — the surfaces a plugin needs to do its normal job: registering
  drivers, themes, exporters/importers, formatters, panels, commands, tools,
  type mappers, completions, drag-drop, notifications, `broadcast`, and reading
  schema metadata (`ctx.schema`). These are how a plugin contributes value;
  gating them would defeat the purpose.

## The capability/permission model

Defined in [`sdk/permissions.ts`](../src/main/plugins/sdk/permissions.ts).

### Declaration

A plugin lists the sensitive capabilities it needs in its manifest:

```jsonc
{
  "name": "my-cloud-driver",
  "version": "1.0.0",
  "displayName": "My Cloud Driver",
  "description": "…",
  "main": "index.js",
  "permissions": ["keyring", "connections", "network"]
}
```

`validateManifest` rejects any unknown permission string at validation time, so
a typo fails the plugin loudly rather than silently granting nothing.

### Enforced vs advisory

| Permission | Tier | Enforced? | What it covers |
|------------|------|-----------|----------------|
| `keyring` | enforced | ✅ host blocks the surface | stored secrets |
| `connections` | enforced | ✅ | connection profiles + live queries |
| `ipc` | enforced | ✅ | custom main-process channels |
| `network` | advisory | ❌ cannot be enforced in-process | outbound network |
| `filesystem` | advisory | ❌ | files outside the plugin folder |
| `process` | advisory | ❌ | launching child processes |

**Enforced** capabilities are wrapped by guards (`guardKeyring`,
`guardConnections`, and an inline check in `ctx.ipc.handle`). An ungranted call
throws `PermissionDeniedError` — synchronously for sync methods, as a rejected
promise for async ones — with an actionable message telling the author what to
add to their manifest.

**Advisory** capabilities are declared for transparency and consent only. Verql
**cannot** stop in-process code from calling `require('node:net')` or
`require('node:child_process')`, and the docs say so plainly rather than
implying a guarantee that doesn't exist. They surface in the consent UI so a
user can see "this plugin says it will talk to the network" before installing,
and they are the seam that a future process-isolation layer would enforce.

### Consent & grants

- Third-party plugins start with **zero** grants. An enforced capability is
  blocked until the user explicitly grants it.
- Grants are managed in the plugin detail view's **Permissions** tab and
  persisted per-plugin in config under `pluginGrants` (`plugins:get-permissions`
  / `plugins:set-permissions` IPC).
- **Grants are intersected with the manifest** (`effectiveGrants`): a plugin can
  never receive a capability it didn't declare, even if a stale grant record
  lists one. Drop a permission from your manifest and the matching grant becomes
  inert.
- Grants are read at **activation** time, so changing a grant takes effect the
  next time the plugin is enabled (the UI prompts the user to re-enable).

## Loading & install hardening

These guards live in `plugin-host.ts` and predate or accompany the permission
model:

- **Path-traversal guard.** A manifest's `main` is resolved and pinned to the
  plugin's own directory; `../../../etc/x.js` or an absolute path is rejected
  before `require()`. (Test: `audit/plugin-path-traversal.test.ts`.)
- **Name shadowing guard.** A discovered or installed plugin whose `name`
  collides with a bundled plugin is refused, so a user-installed
  `verql-plugin-postgresql` can't shadow the built-in postgres driver and
  intercept every postgres credential. (Test: `audit/plugin-bundled-shadowing.test.ts`.)
- **Symlink rejection on install.** `installFromPath` (and therefore
  `installFromZip`, which funnels through it) walks the source tree with
  `lstat` and refuses to install if it finds any symlink — otherwise
  `fs.cpSync` would copy a link pointing at `~/.ssh`, the keychain dir, or
  `/etc` into the trusted plugin folder. (Test: `audit/plugin-install-symlink.test.ts`.)
- **Name validation before copy.** The destination directory is
  `pluginDir/<name>`; the name is checked against `^[a-z0-9-]+$` *before* the
  join so it can't escape the plugin directory.
- **Manifest input validation.** Required fields, semver, and the `^[a-z0-9-]+$`
  name pattern are enforced. (Test: `audit/plugin-manifest-rejects-bad-input.test.ts`.)

## Runtime resilience

Separate from the security boundary, the host limits the damage a *buggy* (not
necessarily malicious) plugin can do to the rest of the app:

- **Activation timeout.** `activate()` is wrapped in `safeCall` with a 10s
  timeout; a hung activation can't block boot forever.
- **Error budget.** Repeated runtime errors from a plugin's callbacks
  (`safeCallWithBudget`) trip an `ErrorBudget` and auto-deactivate it.
- **Scoped disposables.** Everything a plugin registers is tracked on its
  context's `subscriptions` and torn down on deactivation, so an
  uninstall/disable fully unwinds its contributions (including its tools and
  IPC handlers).

## Known limitations (read this)

Be honest about what the model does and does not buy you:

1. **No true sandbox.** Plugins run in the main process. A determined malicious
   plugin can `require` any Node builtin and ignore the advisory permissions.
   The enforced gates only cover the *Verql-provided* surfaces.
2. **Zip extraction shells out to `unzip`.** `installFromZip` uses the system
   `unzip` binary. Modern Info-ZIP refuses traversal entries, and the symlink
   scan + name validation run on the extracted result before anything is
   copied, but `unzip` is not present on stock Windows. Cross-platform
   extraction is tracked below.
3. **No signature / publisher verification.** Verql does not yet verify a
   signature or checksum on an installed plugin, nor is there a curated
   registry. "Only install plugins you trust" is currently a social control.

## Roadmap

In rough priority order:

1. **Process isolation** — run untrusted plugins in a separate `utilityProcess`
   with a message-passing bridge, so the advisory permissions (`network`,
   `filesystem`, `process`) become enforceable and a plugin crash can't take
   down the main process. This is the big one; the permission *declarations*
   above are designed to be the policy input for it.
2. **Cross-platform, in-process zip extraction** to remove the `unzip`
   dependency and fully own traversal/symlink handling.
3. **Signed plugins + a trusted registry** — verify a publisher signature or a
   checksum from a known index at install time, and show provenance in the UI.

## For plugin authors

- Declare every sensitive capability in `permissions`. If you call a gated
  surface without declaring + being granted it, you'll get a
  `PermissionDeniedError` with the exact fix in the message.
- Prefer `ctx.settings` (namespaced) over reaching for app-wide config; you
  cannot use `ctx.rootSettings` anyway.
- Keep `activate()` fast and side-effect-light; push real work behind the
  surfaces you register.
- Ship no symlinks in your plugin package — the installer will refuse it.

## For users

- Treat installing a plugin like installing any other program: it runs with the
  app's privileges. Only install plugins from sources you trust.
- Review the **Permissions** tab before granting. A formatter or theme that
  asks for `keyring` or `network` is a red flag.
- Bundled plugins are part of Verql itself and are trusted; you can disable but
  not uninstall them.

## Tests

The security boundary is pinned by tests under `tests/unit/audit/`:
`plugin-permissions.test.ts`, `plugin-install-symlink.test.ts`,
`plugin-path-traversal.test.ts`, `plugin-bundled-shadowing.test.ts`,
`plugin-manifest-rejects-bad-input.test.ts`, and `sdk-public-surface.test.ts`.
