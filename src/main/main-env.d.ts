// Vite supports `?raw` and `?url` query suffixes on asset imports — these
// declarations let the main-process TypeScript build see the same shape
// the renderer already gets via `src/renderer/src/vite-env.d.ts`.

declare module '*.md?raw' {
  const content: string
  export default content
}

declare module '*.txt?raw' {
  const content: string
  export default content
}
