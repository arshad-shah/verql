import type { Meta, StoryObj } from '@storybook/react-vite'
import { Clock, Rows3, Zap } from 'lucide-react'
import { StatusBarMetric } from './StatusBarMetric'

const meta: Meta<typeof StatusBarMetric> = {
  title: 'Components/Shell/StatusBarMetric',
  component: StatusBarMetric,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="flex h-7 items-center gap-2 bg-bg-primary px-2">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: { color: 'success', label: '128 rows', icon: <Rows3 size={11} /> },
}

export const Error: Story = {
  args: { color: 'error', label: 'syntax error' },
}

export const Warning: Story = {
  args: { color: 'warning', label: 'slow query', icon: <Clock size={11} /> },
}

export const InfoAnimated: Story = {
  args: { color: 'info', label: 'running…', icon: <Zap size={11} />, animated: true },
}
