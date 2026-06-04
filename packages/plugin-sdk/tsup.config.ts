import { defineConfig } from 'tsup'
import path from 'node:path'

// The author-facing SDK is curated in src/index.ts, which re-exports the
// electron-free portion of the app's in-repo SDK (src/main/plugins/sdk). tsup
// bundles those sources into a self-contained package so plugin authors get a
// normal `npm i @verql/plugin-sdk` with no dependency on the app source layout.
//
// `zod` stays external — it's a real runtime dependency (tool schemas) and
// bundling it would risk a dual-zod mismatch with the author's own copy.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['zod'],
  esbuildOptions(options) {
    options.alias = {
      ...(options.alias ?? {}),
      '@shared': path.resolve(__dirname, '../../shared'),
    }
  },
})
