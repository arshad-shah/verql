---
"verql": minor
---

Cynosure migration Stage 10: toasts and notification items replaced.

The hand-rolled toast system (zustand store + `ToastContainer`) is gone:
Cynosure's `Toaster` (Sonner) mounts in App and every call site uses
`toast.success/error/info/loading` directly. The connect lifecycle keeps its
in-place transitions via Sonner ids (`loading` → `success`/`error`), and the
plugin-notifications IPC bus now materialises toasts through a small
`lib/toast-ipc.ts` side-effect module. Notification center entries (dropdown
and sidebar) render Cynosure `Notification` — unread state, click-to-read,
built-in dismiss, and the error copy action in the `actions` slot.

Cynosure's `ThemeToggle` was evaluated and deliberately NOT adopted: it
drives Cynosure's binary light/dark context, while Verql's appearance mode is
a settings-store-backed three-way (light/dark/system) resolved against a
plugin-extensible theme registry — wiring the toggle would fight
`CynosureSchemeSync`. The richer Appearance settings UI (already built on
Cynosure controls) remains the switching surface.
