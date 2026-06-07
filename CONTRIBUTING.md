# Contributing to Verql

Thanks for taking the time. This guide is short on purpose — read top to
bottom and you'll have everything you need to land your first PR.

## Code of Conduct

By participating you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md).
Be kind, be specific, be patient.

## Development setup

```bash
pnpm install      # rebuilds better-sqlite3 for Electron's ABI as part of postinstall
pnpm dev          # launches Electron + Vite with HMR
pnpm test         # runs the unit project (Vitest). See note on better-sqlite3 below.
pnpm exec tsc -b  # typecheck
```

`better-sqlite3` is built for Electron's Node ABI by `electron-rebuild`
(postinstall). The unit tests run under your host Node, which is a
different ABI. Before running `pnpm test` locally:

```bash
pnpm rebuild better-sqlite3
```

CI already handles this in `.github/workflows/ci.yml`.

## How to contribute

1. **Bugs**: open an issue using the
   [bug-report template](./.github/ISSUE_TEMPLATE/bug_report.yml).
   Reproduction steps are the most valuable part.
2. **Features**: open a discussion or issue first if you're planning
   significant work — we want to avoid you spending time on something
   that won't land.
3. **Documentation**: tighten or extend
   [docs/plugins.md](./docs/plugins.md) and
   [docs/ipc.md](./docs/ipc.md) as the surfaces evolve.
4. **Plugins**: see [docs/plugins.md](./docs/plugins.md) for the
   full contribution surface menu.

## Architectural rules

These are enforced by tests; CI will fail if they regress.

1. **Orchestrator stays generic.** The main app and the renderer
   **must not** branch on connection type (`profile.type === 'mysql'`).
   Everything dialect-specific is contributed by a driver plugin.
   (`tests/unit/export-import-no-hardcoding.test.ts`)
2. **Identifiers go through `quoteIdentifier`**. Every SQL identifier
   built from user / introspection data must be escaped via the helper
   in `src/main/db/identifier.ts`. No template-literal `\`"${name}"\``
   patterns.
3. **IPC channels are centrally registered.** Add the channel's `args`/
   `return` shape to `IpcChannelShapes` (keyed by its constant name) and its
   wire string to `IPC_CHANNELS`, both in `shared/ipc.ts` — the wire string
   lives in exactly one place and `IpcChannelMap` is derived from the two. Use
   `IPC_CHANNELS.X` at every call site — never inline string literals.
   (`tests/unit/ipc-channels-coverage.test.ts`)
4. **No new dependency vulnerabilities.** The CI `audit` job fails on
   any high or critical advisory.
5. **DB-agnostic app language.** The shell/glue and the renderer describe the
   database in generic terms — never assume SQL. Don't hardcode "SQL", "EXPLAIN
   ANALYZE", "CREATE TABLE", or relational nouns (table/column/row) in
   user-facing strings; a driver may be Mongo, Redis, or anything. Lean on
   driver capabilities (`editorLanguage`, `explain.statement`, and the `nouns`
   capability — object/field/record — resolved in the renderer via
   `useDataNouns`, falling back to generic words).

## Reduce code: centralize, don't duplicate

Keeping the codebase small is a standing requirement, not a nice-to-have.
**Before adding a helper, hook, formatter, or a copy-pasted block, check whether
one already exists. If the same logic appears in two or more places, unify it
into a single shared implementation instead of adding a third copy.** A change
should then live in exactly one place.

- **Pure helpers** live in `src/renderer/src/lib/` — e.g. `format.ts`
  (`formatCompactNumber`) and `format-time.ts` (`formatRelativeTime`,
  `formatClockTime`).
- **Reusable behaviour** (React state/effects) lives in
  `src/renderer/src/hooks/`. Prefer **one flexible hook over several
  near-identical variants** — e.g. `useClipboard()` is the single
  copy-to-clipboard hook for every surface: it returns a transient `copied`
  flag (inline checkmarks) and `copy(text, { toast })` adds an optional success
  toast (context menus / hover actions).
- **Feature-specific** hooks/sub-components are co-located with the feature
  (e.g. `components/query/hooks/`, `components/connections/form/`).

When a component grows large, split its concerns into co-located hooks and
sub-components rather than letting one file accumulate unrelated responsibilities.

## Pull request workflow

1. Branch from `main`: `git checkout -b your-name/short-description`.
2. Make your change, **including tests** — TDD is the house style.
   New behaviour without a failing-then-green test is rare.
3. Run `pnpm changeset` and pick a bump (`patch` / `minor` / `major`).
   Write the changelog entry from a user's perspective — what changes
   for them, not what we did internally. Commit the generated markdown
   under `.changeset/`.
4. Push and open a pull request. Reference the issue if there is one.
5. CI runs typecheck, lint, audit, unit tests on Node 20 and 22, and
   the production build. All must pass.
6. A maintainer will review. We may push small fixups directly; for
   anything substantive we'll ask.

## Commit / PR style

- Short, imperative subject (`fix: …`, `feat: …`, `docs: …`,
  `refactor: …`, `test: …`, `chore: …`).
- Body explains **why** more than what.
- Wrap at 72 chars in the body.
- Reference issues with `Fixes #123` so they auto-close on merge.

## Releases

Releases are cut by a maintainer from `main`:

1. `pnpm changeset version` consumes the pending markdown changesets,
   bumps `package.json`, and updates `CHANGELOG.md`.
2. The maintainer reviews the diff and commits it.
3. Tagging `vX.Y.Z` triggers `.github/workflows/release.yml`, which
   builds + signs binaries for macOS / Linux, drafts a GitHub release,
   and uploads SBOM and sha256sums.

See [.github/maintainers/release.md](./.github/maintainers/release.md) for the full pipeline, the
required secrets, and where they come from.
