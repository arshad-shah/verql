import type { Meta, StoryObj } from '@storybook/react-vite'
import { Banner } from './Banner'

const meta = {
  title: 'Primitives/Feedback/Banner',
  component: Banner,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'info', 'warning', 'error'],
    },
  },
} satisfies Meta<typeof Banner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'info',
    children: 'A new version of dbstudio is available. Restart to update.',
    style: { width: 480 },
  },
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 480 }}>
      <Banner variant="default">Default system message banner.</Banner>
      <Banner variant="info">Info: scheduled maintenance on Sunday 02:00 UTC.</Banner>
      <Banner variant="warning">Warning: your trial expires in 3 days.</Banner>
      <Banner variant="error">Error: failed to sync — check connection.</Banner>
    </div>
  ),
}
