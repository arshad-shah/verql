import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title: 'Forms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    variant: 'solid',
    size: 'md',
    children: 'Click me',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, auto)', gap: 8, alignItems: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }} />
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div key={size} style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center' }}>{size}</div>
      ))}
      {(['solid', 'outline', 'ghost', 'danger'] as const).map((variant) => (
        <>
          <div key={`label-${variant}`} style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{variant}</div>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <Button key={size} variant={variant} size={size}>{variant}</Button>
          ))}
        </>
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
}
