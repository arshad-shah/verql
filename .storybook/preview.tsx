import React from 'react'
import type { Preview } from '@storybook/react'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
import '../src/renderer/src/styles/globals.css'

// Stub the preload bridge so renderer components that call window.electronAPI.invoke
// during mount (plugin contribution fetches, connection field fetches, etc.) don't
// crash in the browser-based Storybook environment.
if (typeof window !== 'undefined' && !(window as unknown as { electronAPI?: unknown }).electronAPI) {
  ;(window as unknown as { electronAPI: { invoke: (...a: unknown[]) => Promise<unknown>; on: () => () => void } }).electronAPI = {
    invoke: async () => [],
    on: () => () => {},
  }
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    backgrounds: { disable: true },
    layout: 'fullscreen',

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        Nightshift: 'nightshift',
        Lab: 'lab',
        'Ink & Paper': 'inkpaper',
        Dark: 'dark',
        Light: 'light',
        Midnight: 'midnight',
        Dracula: 'dracula',
        Nord: 'nord',
        Solarized: 'solarized',
        Catppuccin: 'catppuccin',
      },
      defaultTheme: 'Nightshift',
      attributeName: 'data-theme',
    }),
    (Story) => (
      <div
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          color: 'var(--color-text-primary)',
          minHeight: '100vh',
          padding: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export default preview
