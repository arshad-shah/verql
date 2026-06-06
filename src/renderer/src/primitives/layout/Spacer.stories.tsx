import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spacer } from './Spacer'

const meta = {
  title: 'Primitives/Layout/Spacer',
  component: Spacer,
} satisfies Meta<typeof Spacer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        padding: '8px 12px',
        background: 'var(--color-bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--color-border)',
      }}
    >
      <span
        style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}
      >
        Left item
      </span>
      <Spacer />
      <span
        style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}
      >
        Right item
      </span>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
          Horizontal flex — Spacer pushes items to opposite ends
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            padding: '8px 12px',
            background: 'var(--color-bg-secondary)',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>Logo</span>
          <Spacer />
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Actions</span>
        </div>
      </div>

      <div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
          Vertical flex — Spacer pushes footer to bottom
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: 160,
            padding: '12px',
            background: 'var(--color-bg-secondary)',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>Header</span>
          <Spacer />
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Footer</span>
        </div>
      </div>

      <div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
          Toolbar with multiple items and a Spacer
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '6px 12px',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>File</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>Edit</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>View</span>
          <Spacer />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Settings</span>
        </div>
      </div>
    </div>
  ),
}
