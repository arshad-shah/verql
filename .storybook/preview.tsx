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
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        Dark: 'dark',
        Light: 'light',
        Midnight: 'midnight',
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
