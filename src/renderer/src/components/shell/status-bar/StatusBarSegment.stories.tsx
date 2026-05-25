import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusBarSegment } from './StatusBarSegment'

const meta: Meta<typeof StatusBarSegment> = {
  title: 'Components/Shell/StatusBar/StatusBarSegment',
  component: StatusBarSegment,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="flex h-7 items-stretch bg-bg-primary border border-border-default rounded">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof StatusBarSegment>

export const Default: Story = { args: { tone: 'default', children: 'plugin · idle' } }
export const Primary: Story = { args: { tone: 'primary', interactive: true, as: 'button', children: 'analytics_prod' } }
export const Schema: Story = { args: { tone: 'schema', interactive: true, as: 'button', children: '/ public' } }
export const AccentSoft: Story = { args: { tone: 'accent-soft', children: '⇄ 3' } }
export const Muted: Story = { args: { tone: 'muted', interactive: true, as: 'button', children: 'No connection' } }
export const Dev: Story = { args: { tone: 'dev', children: 'DEV' } }
