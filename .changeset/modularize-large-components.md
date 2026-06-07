---
"verql": patch
---

Break up the largest renderer components for clearer separation of concern.
No behavior or public-prop changes — each component's logic moved into
co-located hooks and sub-components:

- **ConnectionFormView** (518→263 lines) → `connections/form/` (`PluginFieldInput`,
  `FetchableFieldsWizard`, `SshTunnelSection`, `Section`, `ToggleRow`, shared types).
- **QueryPanel** (463→138) → `useQueryExecution`, `useQueryTransactions`,
  `useQuerySaveDialog` hooks + `SaveQueryDialog`.
- **App** (452→229) → `useAppKeyboardShortcuts`, `useFileDropForwarding`,
  `useShellMenuEvents` hooks + `ActiveTabView` and `TabCloseGuard`.
- **TableNode** (364→221) → `useTableNodeActions` hook + shared `TableHoverActions`.
- **QueryEditor** (277→142) → `useEditorActions`, `useEditorOptions`,
  `useSqlCompletions` hooks + a pure `parseKeybinding` helper (now unit-tested).
