import React from 'react'
import type { Preview } from '@storybook/react'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
import '../src/renderer/src/styles/globals.css'

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
        Dark: 'dark',
        Light: 'light',
        Midnight: 'midnight',
        Dracula: 'dracula',
        Nord: 'nord',
        Solarized: 'solarized',
        Catppuccin: 'catppuccin',
      },
      defaultTheme: 'Dark',
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
