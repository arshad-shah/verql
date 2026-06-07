import type { Meta, StoryObj } from '@storybook/react-vite'
import { HighlightedText } from './HighlightedText'

// HighlightedText renders `text` with the characters that participated in a fuzzy
// match against `query` emphasized (accent-tinted <mark> runs). Purely prop-driven.

const meta: Meta<typeof HighlightedText> = {
  title: 'Components/Explorer/HighlightedText',
  component: HighlightedText,
  decorators: [
    (Story) => (
      <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** No query — falls back to plain, unmarked text. */
export const NoQuery: Story = {
  args: { text: 'organizations', query: '' },
}

/** A contiguous substring match. */
export const Contiguous: Story = {
  args: { text: 'organizations', query: 'org' },
}

/** A scattered fuzzy match — non-adjacent characters get marked. */
export const Fuzzy: Story = {
  args: { text: 'organizations', query: 'oqn' },
}

/** Query that doesn't match — renders plain text (no marks). */
export const NoMatch: Story = {
  args: { text: 'organizations', query: 'xyz' },
}
