import type { Meta, StoryObj } from '@storybook/react'
import { Card } from './Card'

const meta = {
  title: 'Surfaces/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    padding: 'md',
    children: (
      <div style={{ color: 'var(--color-text-primary)', fontSize: 13 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Card title</div>
        <div style={{ color: 'var(--color-text-secondary)' }}>Some card body content goes here.</div>
      </div>
    ),
    style: { width: 280 },
  },
}

export const PaddingVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
      {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((padding) => (
        <Card key={padding} padding={padding}>
          <div style={{ color: 'var(--color-text-primary)', fontSize: 12 }}>padding="{padding}"</div>
        </Card>
      ))}
    </div>
  ),
}
