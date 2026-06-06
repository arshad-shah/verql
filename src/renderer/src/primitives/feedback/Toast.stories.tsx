import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { Toast } from './Toast'

const meta = {
  title: 'Primitives/Feedback/Toast',
  component: Toast,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'error', 'warning', 'info'],
    },
    message: { control: 'text' },
  },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'default',
    message: 'Action completed successfully.',
    onDismiss: fn(),
  },
  decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
  play: async ({ canvas, args }) => {
    const user = userEvent.setup()
    await user.click(canvas.getByRole('button', { name: 'Dismiss' }))
    await expect(args.onDismiss).toHaveBeenCalled()
  },
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 320 }}>
      {([
        { variant: 'default', message: 'Default notification message' },
        { variant: 'success', message: 'Query executed successfully' },
        { variant: 'error', message: 'Connection failed — check credentials' },
        { variant: 'warning', message: 'SSL certificate expires in 7 days' },
        { variant: 'info', message: 'New version available' },
      ] as const).map(({ variant, message }) => (
        <Toast key={variant} variant={variant} message={message} onDismiss={fn()} />
      ))}
    </div>
  ),
}
