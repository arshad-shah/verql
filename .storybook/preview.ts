import type { Preview } from '@storybook/react'
import '../src/renderer/src/styles/globals.css'

// Inject theme attribute on the iframe's html element immediately
// This runs once when the preview module loads, before any story renders
document.documentElement.setAttribute('data-theme', 'dark')

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
