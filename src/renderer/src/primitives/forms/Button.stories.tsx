import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Primitives/Forms/Button',
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
}
export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: { children: 'Button', variant: 'solid', size: 'md' },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(['solid', 'outline', 'ghost', 'danger'] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          <span className="w-16 text-xs text-text-muted">{variant}</span>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <Button key={size} variant={variant} size={size}>
              {size}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
}
