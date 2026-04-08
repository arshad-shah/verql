import type { Preview } from '@storybook/react'
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
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      document.documentElement.setAttribute('data-theme', 'dark')
      return Story()
    },
  ],
}

export default preview
