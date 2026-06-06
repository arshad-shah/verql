import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Portal } from './Portal'

const meta = {
  title: 'Primitives/Utilities/Portal',
  component: Portal,
} satisfies Meta<typeof Portal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          padding: '12px 20px',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--color-text-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
        }}
      >
        Portal content rendered into document.body
      </div>
    ),
  },
  play: async ({ canvas }) => {
    // Portal renders outside the canvas element into document.body,
    // so we query document directly
    const portalContent = document.querySelector('body')
    await expect(portalContent).not.toBeNull()
    await expect(portalContent!.textContent).toContain('Portal content rendered into document.body')
  },
}

export const WithCustomContainer: Story = {
  render: () => {
    const wrapper = document.createElement('div')
    wrapper.id = 'portal-target'
    wrapper.style.cssText =
      'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;'
    document.body.appendChild(wrapper)

    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
          The badge below is rendered into a custom container element (not document.body).
        </p>
        <Portal container={wrapper}>
          <div
            style={{
              padding: '8px 16px',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Custom container portal
          </div>
        </Portal>
      </div>
    )
  },
}
