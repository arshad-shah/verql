import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { IconButton } from './Button'

const meta: Meta<typeof IconButton> = {
  title: 'Primitives/Forms/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost', 'tab-action'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'tab-action'],
    },
    disabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof IconButton>

export const Default: Story = {
  args: {
    variant: 'ghost',
    size: 'md',
    label: 'Settings',
    children: '\u2699',
    onClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: /settings/i })
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(['solid', 'outline', 'ghost'] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          <span className="w-16 text-xs text-text-muted">{variant}</span>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <IconButton key={size} variant={variant} size={size} label={`${variant} ${size}`}>
              \u2715
            </IconButton>
          ))}
        </div>
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton label="Default">\u2605</IconButton>
      <IconButton label="Disabled" disabled>\u2605</IconButton>
    </div>
  ),
}
