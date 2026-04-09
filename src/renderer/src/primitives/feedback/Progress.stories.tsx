import type { Meta, StoryObj } from '@storybook/react-vite'
import { Progress } from './Progress'

const meta = {
  title: 'Primitives/Feedback/Progress',
  component: Progress,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: 'number' },
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 60,
    max: 100,
  },
  decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
}

export const States: Story = {
  render: () => (
    <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 25, 50, 75, 100].map((value) => (
        <div key={value}>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{value}%</div>
          <Progress value={value} />
        </div>
      ))}
    </div>
  ),
}
