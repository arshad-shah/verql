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
    }
    config.plugins = config.plugins || []
    config.plugins.push(tailwindcss())
    return config
  },
  docs: {
    autodocs: 'tag',
  },
}

export default config
