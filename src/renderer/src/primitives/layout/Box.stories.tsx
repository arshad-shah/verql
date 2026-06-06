import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box } from './Box'

const meta = {
  title: 'Primitives/Layout/Box',
  component: Box,
  argTypes: {
    padding: {
      control: 'select',
      options: [undefined, 'xs', 'sm', 'md', 'lg', 'xl'],
    },
    paddingX: {
      control: 'select',
      options: [undefined, 'xs', 'sm', 'md', 'lg', 'xl'],
    },
    paddingY: {
      control: 'select',
      options: [undefined, 'xs', 'sm', 'md', 'lg', 'xl'],
    },
    radius: {
      control: 'select',
      options: [undefined, 'sm', 'md', 'lg', 'full'],
    },
  },
} satisfies Meta<typeof Box>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    padding: 'md',
    radius: 'md',
    children: 'Box content',
    style: { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' },
  },
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((p) => (
        <Box
          key={p}
          padding={p}
          style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)', borderRadius: 6 }}
        >
          padding="{p}"
        </Box>
      ))}
    </div>
  ),
}
