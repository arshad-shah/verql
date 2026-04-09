import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { VisuallyHidden } from './VisuallyHidden'

const meta = {
  title: 'Primitives/Utilities/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['autodocs'],
} satisfies Meta<typeof VisuallyHidden>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <button
      type="button"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        cursor: 'pointer',
        color: 'var(--color-text-primary)',
        fontSize: 18,
      }}
    >
      {/* Icon-only button — label is hidden visually but accessible */}
      <span aria-hidden="true">×</span>
      <VisuallyHidden>Close dialog</VisuallyHidden>
    </button>
  ),
  play: async ({ canvas }) => {
    // sr-only text is in the DOM and findable by testing-library
    const hiddenText = canvas.getByText('Close dialog')
    await expect(hiddenText).toBeInTheDocument()

    // The button itself is accessible via its hidden label
    const button = canvas.getByRole('button', { name: /close dialog/i })
    await expect(button).toBeInTheDocument()

    // Verify clicking works
    await userEvent.click(button)
  },
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>
          Icon-only button with accessible label
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['×', '✓', '↑', '↓'] as const).map((icon) => (
            <button
              key={icon}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                cursor: 'pointer',
                color: 'var(--color-text-primary)',
                fontSize: 16,
              }}
            >
              <span aria-hidden="true">{icon}</span>
              <VisuallyHidden>Action {icon}</VisuallyHidden>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>
          VisuallyHidden inside a label for a custom input
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="search-demo" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            <VisuallyHidden>Search</VisuallyHidden>
            <span aria-hidden="true" style={{ marginRight: 4 }}>🔍</span>
          </label>
          <input
            id="search-demo"
            type="text"
            placeholder="Search..."
            style={{
              padding: '6px 10px',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              color: 'var(--color-text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>
    </div>
  ),
}
