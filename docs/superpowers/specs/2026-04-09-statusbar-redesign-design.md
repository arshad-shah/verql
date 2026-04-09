# Status Bar Redesign — Command Dock

## Overview

Ground-up redesign of the application status bar from a simple accent-colored strip into a "Command Dock" — a three-zone interactive bar with bordered cards, contextual metrics, a connection switcher dropdown, and a slide-out notification panel.

## Design Direction

The Command Dock draws no direct inspiration from existing tools. It treats the status bar as a dock of interactive cards rather than a passive text strip. Each piece of information lives in a discrete, bordered surface. The bar is taller (38px vs current 24px), giving room for richer interaction targets.

Key principles:
- **Cards, not text** — every data point is a bordered card or tinted chip
- **Context-adaptive center** — the center zone shows what matters right now
- **Semantic color coding** — each DB type, status level, and metric type has a distinct color
- **Interactive surfaces** — connection card opens a switcher, bell opens a notification panel

## Architecture

### Component Structure

```
StatusBar (38px, bg-bg-primary, border-top)
├── LeftZone (connection)
│   ├── ConnectionCard (clickable → ConnectionSwitcher)
│   │   ├── StatusOrb (green/red/gray with glow)
│   │   ├── DB type label (PG/MY/SL/MG/RD, colored per type)
│   │   ├── Database name
│   │   ├── Schema (prefixed with /)
│   │   └── Dropdown arrow (▾/▴)
│   └── ConnectionCountBadge (only when >1 connection)
│
├── CenterZone (contextual metrics)
│   ├── IdleState: QueryTime chip + RowCount chip
│   ├── RunningState: animated "Running... {elapsed}" chip
│   ├── ErrorState: error message chip
│   └── DisconnectedState: em dash placeholder
│
└── RightZone (tools)
    ├── PluginStatus card (dot + count)
    ├── NotificationBell card (clickable → NotificationPanel)
    │   └── Badge count (red dot with number, when >0)
    └── DevBadge (DEV mode only)
```

### New Components to Create

1. **StatusBar** — complete rewrite of existing component
2. **ConnectionCard** — the clickable connection display in the left zone
3. **ConnectionSwitcher** — dropdown opened by ConnectionCard
4. **StatusBarMetric** — reusable tinted chip for center zone metrics
5. **NotificationBell** — bell icon with badge count
6. **NotificationPanel** — slide-out panel with categorized notifications
7. **NotificationItem** — individual notification row

### Existing Components to Modify

- **StatusBar.stories.tsx** — rewrite stories for new component

## Detailed Design

### 1. Status Bar Container

- Height: 38px
- Background: `bg-bg-primary` (matches app chrome, not accent-colored)
- Top border: 1px solid `border-default`
- Layout: `display: flex; align-items: center; justify-content: space-between`
- Three zones: left (margin-right: auto), center, right (margin-left: auto)
- Padding: 0 12px
- Gap between items within zones: 4-6px

### 2. Connection Card (Left Zone)

**Appearance:**
- Background: `bg-bg-tertiary`
- Border: 1px solid `border-default`
- Border radius: 6px
- Padding: 4px 10px
- Cursor: pointer
- Hover: subtle background lighten

**Contents:**
- Status orb: 7px circle
  - Connected: `color-success` with box-shadow glow
  - Disconnected: `color-text-tertiary`, no glow
  - Error: `color-error` with red glow
- DB type abbreviation: 10px, bold, colored per type:
  - PostgreSQL → `PG` in purple (`color-accent`)
  - MySQL → `MY` in amber (`color-warning`)
  - SQLite → `SL` in blue (`color-info`)
  - MongoDB → `MG` in coral (#ff8c6b)
  - Redis → `RD` in red (`color-error`)
- Database name: 10px, `color-text-primary`
- Schema: 10px, `color-text-tertiary`, prefixed with "/ "
- Dropdown arrow: 8px, `color-text-disabled`, flips when open

**Disconnected state:**
- Opacity: 0.6
- Orb: gray
- Text: "No connection"

**Error state:**
- Background tinted red: `rgba(color-error, 0.08)`
- Border tinted red: `rgba(color-error, 0.2)`
- All text in `color-error`
- Shows "Connection lost" instead of schema

**Connection count badge** (shown when connectedIds.size > 1):
- Tinted accent chip: `rgba(color-accent, 0.08)` background
- Shows "↔ {count}"

### 3. Connection Switcher Dropdown

Opens upward from the connection card.

**Container:**
- Width: 260px
- Background: `bg-bg-secondary`
- Border: 1px solid `border-default`
- Border radius: 8px 8px 0 0
- Box shadow: `0 -4px 20px rgba(0,0,0,0.5)`
- Anchored to bottom-left of connection card

**Sections (top to bottom):**

1. **Search bar** — filter input at top, bordered, with search icon
2. **Active** — current connection with accent background tint and checkmark icon
3. **Connected** — other live connections, each showing orb + type + name + host
4. **Saved** — disconnected profiles, dimmed (opacity 0.5), gray orb
5. **Footer** — "+ New connection" action link in accent color

**Interactions:**
- Click connected connection → switch `activeConnectionId`
- Click saved connection → initiate connection (calls `connect()`)
- Click "+ New connection" → open ConnectionForm modal
- Filter input filters across all sections by name, host, database
- Close on: Esc, click outside, selecting a connection
- Connection card gets accent tint and arrow flips to ▴ when dropdown is open

### 4. Center Zone — Contextual Metrics

Adapts based on current activity. Each metric is a **StatusBarMetric** chip.

**StatusBarMetric chip:**
- Background: `rgba({color}, 0.08)`
- Border: 1px solid `rgba({color}, 0.15)`
- Border radius: 5px
- Padding: 3px 8px
- Font size: 10px
- Text color: the semantic color

**States:**

| State | Chips shown | Colors |
|-------|------------|--------|
| Idle (after query) | "⚡ {duration}" + "{rowCount} rows" | green, blue |
| Query running | "● Running... {elapsed}" (animated pulse) | warning/amber |
| Connection error | "⚠ Reconnecting..." | red |
| Disconnected | Em dash "—" in muted text | text-disabled |

**Data sources:**
- Query duration and row count: from the active tab's last query result (already in tab store or passed from QueryPanel)
- Running state: from query execution state
- Error state: from connection store's error state

### 5. Notification System

#### NotificationBell

- Background: `bg-bg-tertiary`
- Border: 1px solid `border-default`
- Border radius: 6px
- Padding: 4px 8px
- Contains: Bell icon (lucide `Bell`, 12px, `color-text-secondary`)
- Badge: positioned absolute top-right
  - Background: `color-error`
  - Color: white
  - Font size: 7px, bold
  - Min-width/height: 10px, border-radius: 5px
  - Only shown when unread count > 0
- When panel is open: accent tint background, accent stroke on icon

#### NotificationPanel

Slides up from bottom-right, anchored above the status bar.

**Container:**
- Width: 320px
- Max height: 350px (scrollable)
- Background: `bg-bg-secondary`
- Border: 1px solid `border-default`
- Border radius: 8px 8px 0 0
- Box shadow: `0 -4px 24px rgba(0,0,0,0.4)`
- Opens/closes with a subtle slide-up animation (150ms ease-out)

**Header:**
- "Notifications" title (12px, semibold)
- "X new" badge (red tint) when unread exist
- "Mark all read" action (accent color)
- Close button (✕)

**Body — grouped by category:**
Categories in order: Errors, Warnings, Info, Success. Each category:
- Label: 9px, uppercase, category color, letter-spacing 0.5px
- Only shown if category has notifications

**NotificationItem:**
- Colored dot (6px, category color) — filled if unread, dimmed if read
- Message text: 11px, `color-text-primary` (unread) or `color-text-secondary` (read)
- Source + timestamp: 9px, `color-text-tertiary` (e.g., "Tab 'User Query' · 2m ago")
- Read items: opacity 0.6
- Hover: subtle background highlight
- Click: navigate to source and mark as read

**Empty state:**
- Bell icon (24px, muted)
- "All caught up" heading
- "No new notifications" subtitle

#### Notification Store

New Zustand store: `useNotificationsStore`

```typescript
interface Notification {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  source?: { type: 'tab' | 'connection' | 'plugin'; id: string; label: string }
  timestamp: number
  read: boolean
}

interface NotificationsState {
  notifications: Notification[]
  panelOpen: boolean
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
  togglePanel: () => void
  closePanel: () => void
  unreadCount: () => number
}
```

**Notification sources** (integration points):
- Query execution failures → error notification
- Connection established/lost → info/error notification
- Plugin activation success/failure → info/warning notification
- Export complete → success notification

Maximum 50 notifications retained (oldest pruned on add).

### 6. Plugin Status Card (Right Zone)

Simplified from current implementation:
- Background: `bg-bg-tertiary`
- Border: 1px solid `border-default`
- Border radius: 6px
- Padding: 4px 8px
- Contents: colored dot + "{active} plugins" text
  - All healthy: green dot, `color-text-secondary` text
  - Some failed: amber dot, text shows "{active}/{total}"
  - Loading: Spinner replaces dot

### 7. DEV Badge

Only shown when `import.meta.env.DEV` is true.
- Background: `color-accent`
- Color: white
- Padding: 4px 7px
- Border radius: 6px
- Font size: 9px, bold
- Text: "DEV"

## States Summary

| App State | Left Zone | Center Zone | Right Zone |
|-----------|----------|-------------|------------|
| Connected, idle | Full connection card | Last query metrics | All tools |
| Connected, query running | Full connection card | Running + elapsed | All tools |
| Connected, query done | Full connection card | Duration + rows | All tools |
| Multiple connections | Card + count badge | Last query metrics | All tools |
| Connection error | Red-tinted card | "Reconnecting..." | Bell may show error notification |
| Disconnected | Dimmed "No connection" | Em dash | Plugins + bell + DEV |
| With schema | Card shows "/ public" | Normal | Normal |

## Theme Support

All three themes (dark, midnight, light) supported via semantic tokens:
- Dark/Midnight: card backgrounds use `bg-bg-tertiary`, borders use `border-default`
- Light: same tokens resolve to lighter values automatically
- Status colors (success, warning, error, info) are already theme-aware
- Tinted chip backgrounds use `rgba()` with semantic color values for automatic theme adaptation

No new tokens required — existing semantic token system covers all needs.

## Interactions Summary

| Target | Action | Result |
|--------|--------|--------|
| Connection card | Click | Toggle connection switcher dropdown |
| Connection card | Hover | Subtle background lighten |
| Switcher: connected item | Click | Switch active connection, close dropdown |
| Switcher: saved item | Click | Initiate connection |
| Switcher: "+ New connection" | Click | Open ConnectionForm modal |
| Notification bell | Click | Toggle notification panel |
| Notification item | Click | Navigate to source, mark as read |
| "Mark all read" | Click | Clear all unread badges |
| Panel/Dropdown outside | Click | Close |
| Esc key | Press | Close any open panel/dropdown |

## Files to Create

- `src/renderer/src/components/shell/StatusBar.tsx` — rewrite
- `src/renderer/src/components/shell/ConnectionCard.tsx`
- `src/renderer/src/components/shell/ConnectionSwitcher.tsx`
- `src/renderer/src/components/shell/StatusBarMetric.tsx`
- `src/renderer/src/components/shell/NotificationBell.tsx`
- `src/renderer/src/components/shell/NotificationPanel.tsx`
- `src/renderer/src/components/shell/NotificationItem.tsx`
- `src/renderer/src/stores/notifications.ts`
- `src/renderer/src/components/shell/StatusBar.stories.tsx` — rewrite

## Files to Modify

- Query execution code — add notification dispatch on failure
- Connection store — add notification dispatch on connect/disconnect/error
- Plugin loading — add notification dispatch on activation/failure

## Out of Scope

- Notification persistence across app restarts
- Notification preferences/settings
- Sound/desktop notifications
- Connection card drag-to-reorder
- Status bar customization/reordering
