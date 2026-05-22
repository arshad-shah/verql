import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// Modules that genuinely can't be bundled into out/main/index.js:
//   - have native `.node` bindings
//   - or use runtime path tricks against their own package layout
// These stay external and must be in node_modules at runtime.
//
// EVERYTHING ELSE is bundled into out/main/index.js by Rollup. This is the
// reliable workaround for electron-builder + pnpm: the dep-graph walker
// silently drops transitive deps (es-object-atoms, mime-db, get-intrinsic,
// ...) under some pnpm layouts, and the app crashes at launch with
// "Cannot find module 'X'". Bundling eliminates the dependency on
// node_modules layout entirely for pure-JS deps.
const nativeExternals = [
  'better-sqlite3',
  'pg',
  'pg-native',
  'mysql2',
  'ssh2',
  'cpu-features',
  '@electron/rebuild'
]

export default defineConfig({
  main: {
    plugins: [
      // exclude lists deps to BUNDLE (i.e. NOT externalize). Snowflake-sdk
      // and its tree was the original culprit; bundling them inlines
      // every transitive require so it doesn't matter what's in node_modules.
      externalizeDepsPlugin({
        exclude: [
          'snowflake-sdk',
          'axios',
          'form-data',
          'mime-types',
          'mime-db',
          '@modelcontextprotocol/sdk',
          'zod',
          'csv-parse',
          'csv-stringify',
          'mongodb',
          'ioredis',
          'shiki',
          'react-markdown',
          'remark-gfm',
          'dompurify'
        ]
      })
    ],
    build: {
      rollupOptions: {
        external: nativeExternals
      }
    },
    resolve: {
      alias: { '@shared': resolve('shared') }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['better-sqlite3']
      }
    },
    resolve: {
      alias: { '@shared': resolve('shared') }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@shared': resolve('shared'),
        '@brand': resolve('build')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
