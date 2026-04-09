import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { ThemeProvider, useTheme } from './ThemeProvider'

/** Inner component that reads and controls the theme — used in stories. */
function ThemeDemo() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div
      style={{
        padding: 24,
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minWidth: 340,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Current theme:
        </span>
        <span
          data-testid="current-theme"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            textTransform: 'capitalize',
          }}
        >
          {theme}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {themes.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: theme === t ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
              background: theme === t ? 'var(--color-bg-elevated)' : 'var(--color-bg-secondary)',
              color: theme === t ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontSize: 12,
              fontWeight: theme === t ? 600 : 400,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        style={{
          padding: '10px 14px',
          background: 'var(--color-bg-secondary)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--color-text-secondary)',
        }}
      >
        Theme tokens update automatically via the <code>data-theme</code> attribute.
      </div>
    </div>
  )
}

const meta = {
  title: 'Primitives/Theme/ThemeProvider',
  component: ThemeProvider,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeProvider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <ThemeDemo />,
  play: async ({ canvas }) => {
    // Initial theme label is visible
    const themeLabel = canvas.getByTestId('current-theme')
    await expect(themeLabel).toBeInTheDocument()

    // Click the "light" button and verify the displayed theme updates
    const lightButton = canvas.getByRole('button', { name: /^light$/i })
    await userEvent.click(lightButton)
    await expect(themeLabel).toHaveTextContent('light')

    // Switch to "midnight" and verify
    const midnightButton = canvas.getByRole('button', { name: /^midnight$/i })
    await userEvent.click(midnightButton)
    await expect(themeLabel).toHaveTextContent('midnight')
  },
}

export const AllThemes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
        Each panel below is wrapped in its own ThemeProvider instance.
      </p>
      {(['dark', 'light', 'midnight', 'dracula', 'nord', 'solarized', 'catppuccin'] as const).map(
        (t) => (
          <ThemeProvider key={t}>
            <div
              data-theme={t}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  width: 90,
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </span>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
                  border: '2px solid var(--color-border)',
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                accent · bg · text tokens
              </span>
            </div>
          </ThemeProvider>
        )
      )}
    </div>
  ),
}
