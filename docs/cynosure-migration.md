# Cynosure migration

Verql is migrating its hand-rolled design system (`src/renderer/src/primitives/`,
CVA + Tailwind) to [`@arshad-shah/cynosure-react`](https://cynosure.arshadshah.com).
The end state: **all** UI is built from Cynosure components and layout
primitives, styled exclusively through Cynosure's props API; no Tailwind, no
custom CSS except where Cynosure genuinely cannot express something (each such
exception is documented inline). The migration is a **clean break** — call
sites adopt Cynosure's props API directly (e.g. Verql Button's
`variant="error"` becomes Cynosure's `colorScheme="danger"`); there is no
compatibility wrapper layer to remove later.

## How theming works

Cynosure components read `--cynosure-*` semantic CSS variables
([`@arshad-shah/cynosure-tokens`](https://www.npmjs.com/package/@arshad-shah/cynosure-tokens)).
Verql themes — the baseline Nightshift, the `core-themes` plugin's nine, and
any third-party theme plugin — define Verql's `--color-*` semantic tokens
under `[data-theme="<id>"]` (see `docs/plugins.md`, theme contribution).

The bridge ([`src/renderer/src/styles/cynosure-bridge.css`](../src/renderer/src/styles/cynosure-bridge.css))
aliases every semantic Cynosure token to its Verql counterpart at
`:root, :root[data-theme]`, imported **after** Cynosure's CSS so it wins every
cascade tie. The active theme therefore restyles Cynosure automatically; theme
authors keep writing only Verql tokens. Non-colour tokens (spacing, radius,
shadows, motion) keep Cynosure defaults on purpose.

Light/dark *scheme* (native scrollbars, `useColorScheme()` consumers such as
charts, CodeBlock's highlight flip) is published separately:
`CynosureSchemeSync` ([`src/renderer/src/primitives/theme/cynosure.tsx`](../src/renderer/src/primitives/theme/cynosure.tsx))
maps the resolved theme id to its registry-declared `type` and feeds it to
Cynosure's ThemeProvider on the `data-cynosure-scheme` attribute (never
`data-theme`, which belongs to Verql theme ids — Verql has a theme literally
named `dark`).

Guard rails: [`tests/unit/cynosure-bridge.test.ts`](../tests/unit/cynosure-bridge.test.ts)
fails when a Cynosure upgrade adds a semantic token the bridge doesn't cover;
[`tests/unit/cynosure-scheme-sync.test.tsx`](../tests/unit/cynosure-scheme-sync.test.tsx)
covers the scheme sync.

## Rules for migration stages

1. **Props API only.** Style Cynosure components through their documented props
   (authority: the package's `.d.ts` files / [docs site](https://cynosure.arshadshah.com)),
   never `className` with utility classes. Use Cynosure defaults wherever
   possible.
2. **Layout = Cynosure layout primitives** (`Box`, `Stack`, `Inline`, `Flex`,
   `Grid`, `Center`, `Spacer`, …) — no hand-rolled `<div>` scaffolding.
3. **Check Cynosure first — at the FEATURE level, not just the component
   level.** Before keeping/porting any bespoke component or adding any
   slot/action, check the Cynosure inventory (`components.config.mjs` in the
   cynosure repo) *and* the component's built-in behaviours — e.g.
   `Input type="password"` ships its own reveal toggle and `clearable` ships
   a clear button, so Verql's PasswordInput and SearchInput `onClear` were
   deleted, not ported. Don't add an action a Cynosure component already has.
4. **No wrappers around Cynosure components.** Call sites use Cynosure
   directly. The only Verql components that may *compose* Cynosure parts are
   ones carrying real app behaviour Cynosure doesn't model (e.g. `KbdGroup`'s
   Electron-accelerator parsing, `FilePathInput`'s native dialog) — never a
   styling or API-shim layer.
5. **Per stage:** migrate a coherent slice; delete the replaced Verql
   primitive + its stories; update every call site (clean break); keep
   `pnpm exec vitest run --project unit` green; add a changeset; update the
   status table below.
6. **TDD:** when behaviour moves (not just markup), pin it with a unit test
   before swapping the implementation.

## Status

| Stage | Scope | Status |
| --- | --- | --- |
| 1 | Foundation: dependency, token bridge, `CynosureAppProvider` + scheme sync | ✅ done |
| 2 | `Button` / `IconButton` → Cynosure `button` / `icon-button` | ✅ done |
| 3 | Feedback: `Spinner`, `Skeleton`, `Progress`, `Alert`, `Banner` (Toast deferred to stage 10) | ✅ done |
| 4 | Typography: `Text`, `Heading`, `Code`, `Kbd`/`KbdGroup` (KbdGroup kept: accelerator/platform behaviour atop Cynosure `Kbd`) | ✅ done |
| 5a | Forms (text-input family): `Input`, `Textarea`, `NumberInput`, `SearchInput`, `PasswordInput` (→ `Input type=password`, built-in reveal), `Label` | ✅ done |
| 5b | Forms (choice controls): `Checkbox`, `Switch`, `Select` (+`Combobox` for searchable); unused `Radio`/`Slider`/`TagsInput`/`DatePicker` deleted | ✅ done |
| 5c | Forms (composites): `FormField` → Cynosure form composition, `ColorInput`/`ColorPicker` → Cynosure `color-picker` (popover variant); `FileContentInput`/`FilePathInput` kept (native dialog behaviour) | ✅ done |
| 6 | Layout: `Box`, `Stack`, `Flex`, `Grid`, `Divider`, `Spacer`, `ScrollArea`, `Container`, `AspectRatio` | ⬜ |
| 7 | Surfaces/overlays: `Card`, `Modal`→`Dialog`, `Sheet`→`Drawer`, `Popover`, `Tooltip`, `DropdownMenu`, `ContextMenu`, `Accordion`, `Panel` | ⬜ |
| 8 | Data display: `Badge`, `Tag`, `Avatar`, `EmptyState`, `Table`/`DataTable`, `List`, `TreeItem`→`Tree`, `KeyValue`, `CodeView`→`CodeBlock` | ⬜ |
| 9 | Navigation: `Tabs`, `Breadcrumb`, `Link`, `Pagination`; utilities (`ResizeHandle`→`Resizable`, `VisuallyHidden`, `Portal`) | ⬜ |
| 10 | Notifications/toasts → Cynosure `Notification`/`Toast`; theme toggle UI → `theme-toggle` | ⬜ |
| 11 | Long tail: component-level Tailwind classes → Cynosure layout/props; remove Tailwind + CVA; delete `primitives/` remnants | ⬜ |

Stages may be reordered or split as call-site counts dictate; each lands as
its own commit + changeset.
