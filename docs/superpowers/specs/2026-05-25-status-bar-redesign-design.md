# Status Bar Redesign — Design

**Date:** 2026-05-25
**Scope:** [src/renderer/src/components/shell/StatusBar.tsx](../../../src/renderer/src/components/shell/StatusBar.tsx) and its immediate children.

## Goal

Restyle the status bar in a VS Code–style segmented format so it reads as a single, edge-to-edge ribbon of tappable cells — closer in feel to dedicated DB clients (DataGrip / Beekeeper). **The data shown is unchanged from today**; only layout, segmentation, and visual treatment change.

## What stays the same

- Data sources: `useConnectionsStore`, `useTabsStore`, `useNotificationsStore`, `usePluginUIStore`.
- Plugin-contributed `statusBar` widgets via `WidgetRenderer`, still filtered to the active connection's driver.
- Plugin polling logic (15-second window, 2-second interval) and the one-shot failure notification.
- `ConnectionSwitcher` dropdown component (only the trigger surface changes).
- The `statusbar:new-connection` window event handshake.
- `DEV` badge visibility (dev builds only).

## Visual design

A 28px-tall flat bar with `border-top: 1px solid border-default`, `background: bg-primary`. Children are **segments** that fill the full bar height and are separated by 1px vertical dividers (`border-default`). No outer padding on the bar itself — segments own their horizontal padding (10px).

### Segment inventory

| Segment | Side | Visibility | Interaction |
|---|---|---|---|
| **Connection** (primary) | left | always | click → toggle `ConnectionSwitcher` |
| **Schema** (continuation) | left | when `queryTab?.schema` exists | click → toggle `ConnectionSwitcher` (same as today's card) |
| **Multi-connection count** | left | when `connectedIds.size > 1` | click → open `ConnectionSwitcher` |
| **Plugin widgets** | right | per-widget visibility from contributions | per-widget (delegated to `WidgetRenderer`) |
| **Plugin status** | right | always | static for now (matches today) |
| **DEV** | right | dev builds only | static |

A `flex: 1` spacer separates the left group from the right group.

### Segment styling

- **Default segment:** transparent background, `text-secondary` text, `cursor: pointer` when clickable, `cursor: default` when static. Hover: `background: rgba(255,255,255,.04)` (use existing `hover:bg-bg-tertiary/50` token equivalent).
- **Connection segment (connected):** `bg-accent` background, `text-white`, semibold; status dot is `bg-success` with a 2px translucent halo. Driver name rendered as a small inset chip with `bg-white/18`.
- **Connection segment (disconnected):** `bg-bg-tertiary`, `text-primary`, neutral dot, label `"No connection"` with `"click to connect"` hint chip.
- **Schema segment:** `bg-accent/12`, `text-accent`, mono font (`font-mono`), 10.5px. Rendered with a leading `/` so the eye reads `analytics_prod / public` as a path.
- **Multi-connection segment:** neutral background, warning text color, `ArrowLeftRight` icon at 11px + count.
- **Plugin status segment:** existing pill content (loading spinner / dot + count) but flush in a segment, no rounded border.
- **DEV segment:** filled `bg-accent`, white, 10px bold uppercase.

Dividers are `border-right: 1px solid border-default` on left-group segments, `border-left` on right-group segments.

### States covered by the mock

1. Default — connected, single connection, query tab active (schema visible).
2. Multi-connection — extra segment appears.
3. Disconnected — connection segment swaps to neutral variant; schema hidden.
4. Plugins loading — animated dot + `Loading…`.
5. Plugin failure — warning dot + `active/total plugins`.

(Mockup preserved at `.superpowers/brainstorm/34630-1779703224/content/statusbar-mock.html`.)

## Component structure

Split [StatusBar.tsx](../../../src/renderer/src/components/shell/StatusBar.tsx) — currently a single 200-line file mixing layout, plugin polling, and three sub-presentations — into:

```
src/renderer/src/components/shell/
  StatusBar.tsx                 # composition only: hooks + segment layout
  status-bar/
    StatusBarSegment.tsx        # CVA-based primitive: variant (default|primary|schema|accent|dev), interactive
    ConnectionSegment.tsx       # replaces ConnectionCard usage; renders primary segment + opens switcher
    SchemaSegment.tsx           # continuation segment, hidden when no schema
    MultiConnectionSegment.tsx  # shown when connectedIds.size > 1
    PluginStatusSegment.tsx     # absorbs the plugin-polling effect + presentation
    DevSegment.tsx              # trivial; here for symmetry
    usePluginStatus.ts          # extracted hook for the polling logic + failure notification
```

`ConnectionCard.tsx` is retained but no longer referenced from `StatusBar.tsx`; it stays for any other call sites. (If there are none, we'll remove it during implementation — to be confirmed in the plan.)

### `StatusBarSegment` variants

CVA recipe with variants:
- `tone`: `"default" | "primary" | "schema" | "accent-soft" | "dev"`
- `interactive`: `boolean` — adds hover background + `cursor-pointer`
- `side`: `"left" | "right"` — controls which edge gets the 1px divider

## Behavior

- The connection segment is the switcher trigger. The `switcherOpen` state and `ConnectionSwitcher` dropdown move into `ConnectionSegment.tsx`.
- Clicking the schema segment opens the same switcher (matches today's `ConnectionCard` behavior).
- Clicking the multi-connection segment opens the switcher.
- All other segments are non-interactive in this iteration. (Click-to-act behavior — commit/rollback, go-to-line, etc. — is explicitly out of scope.)

## Testing

- Update or add stories under `src/renderer/src/components/shell/status-bar/*.stories.tsx` covering each segment's variants and each of the five composite states above.
- Storybook a11y checks via the existing browser project must pass.
- No new unit tests required (no new logic; polling moves verbatim into `usePluginStatus`).

## Out of scope (deferred)

- Transaction state / autocommit indicator.
- Query stats (rows · time).
- Editor cursor position.
- Server version / encoding segments.
- Notifications bell.
- Making plugin status / DEV segments clickable.
