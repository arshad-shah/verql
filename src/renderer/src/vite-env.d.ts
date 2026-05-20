/// <reference types="vite/client" />

// Vite's `?url` / `?raw` query suffixes for asset imports. Vite handles these
// natively at build time; this just teaches TypeScript that the modules
// resolve to a URL string so editor imports type-check.
declare module '*.svg?url' {
  const src: string
  export default src
}
declare module '*.svg?raw' {
  const src: string
  export default src
}
