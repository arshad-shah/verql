---
"verql": patch
---

Continue the incremental Cynosure migration: rebuild the `FilePathInput` and
`FileContentInput` primitives on Cynosure's `FileUpload` (and `Textarea` for the
paste-content mode), dropping their hand-rolled markup + Tailwind. Both wrappers
keep their value-based string APIs, so the lone consumer (`PluginFieldInput`) is
unchanged apart from the removed `size` prop — `FileUpload` has no size, so the
in-house `xs`–`xl` scale is gone (one `size="lg"` call site dropped). The
`placeholder` prop on `FilePathInput` is removed (nothing used it).

The browse action now uses Cynosure's native file picker (in Electron this is
still the OS dialog), reading contents via `File.text()` and resolving the
`file-path` native path via a new `electronAPI.getPathForFile` preload bridge
(`webUtils.getPathForFile`, the Electron 32+ replacement for the removed
`File.path`). This retires the `dialog:open-file` / `dialog:open-file-path` IPC
channels and their handler, which had no other consumers. The jsdom
`FileContentInput` unit test (which asserted the old IPC) is removed in favour of
the Storybook story tests.
