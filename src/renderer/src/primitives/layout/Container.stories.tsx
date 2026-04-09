import type { Meta, StoryObj } from '@storybook/react'
import { Container } from './Container'

const meta = {
  title: 'Primitives/Layout/Container',
  component: Container,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
  },
} satisfies Meta<typeof Container>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    size: 'md',
    children: 'Container content — centered with max-width constraint.',
    style: { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)', padding: 16, borderRadius: 6 },
  },
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      {(['sm', 'md', 'lg', 'xl', 'full'] as const).map((size) => (
        <Container key={size} size={size}>
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)', padding: '8px 12px', borderRadius: 4, fontSize: 12 }}>
            size="{size}"
          </div>
        </Container>
      ))}
    </div>
  ),
}
