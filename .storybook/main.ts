import type { StorybookConfig } from '@storybook/react-vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: [
    '../src/renderer/src/primitives/**/*.stories.tsx',
    '../src/renderer/src/components/**/*.stories.tsx',
    '../src/renderer/src/primitives/patterns/**/*.stories.tsx',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-mcp',
    '@storybook/addon-vitest'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname, '../src/renderer/src'),
      '@shared': resolve(__dirname, '../shared'),
      // Mirror the app renderer's `@brand` alias (electron.vite.config.ts) so
      // components that import brand assets (e.g. the title bar icon) resolve
      // in Storybook too.
      '@brand': resolve(__dirname, '../build'),
    }
    config.plugins = config.plugins || []
    config.plugins.push(tailwindcss())
    // Force esbuild to use the automatic JSX runtime so story files don't need
    // an explicit `import React` — without this, Storybook's builder transpiles
    // JSX to `React.createElement(...)` and stories throw "React is not defined".
    config.esbuild = {
      ...(config.esbuild || {}),
      jsx: 'automatic',
    }
    return config
  },
}

export default config
