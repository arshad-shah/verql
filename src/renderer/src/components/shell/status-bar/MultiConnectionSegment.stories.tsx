import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { fn } from 'storybook/test'
import { MultiConnectionSegment } from './MultiConnectionSegment'
import { useConnectionsStore } from '@/stores/connections'

function seedConnected(count: number) {
  useConnectionsStore.setState({
    connectedIds: new Set(Array.from({ length: count }, (_, i) => `c${i}`)),
  })
}

const meta: Meta<typeof MultiConnectionSegment> = {
  title: 'Components/Shell/StatusBar/MultiConnectionSegment',
  component: MultiConnectionSegment,
  parameters: { layout: 'centered' },
  args: { onClick: fn() },
  decorators: [
    (Story) => (
      <div className="flex h-7 items-stretch bg-bg-primary border border-border-default rounded">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** Two active connections — the minimum to render. */
export const Two: Story = {
  decorators: [(Story) => { useEffect(() => { seedConnected(2) }, []); return <Story /> }],
}

/** Several active connections. */
export const Many: Story = {
  decorators: [(Story) => { useEffect(() => { seedConnected(5) }, []); return <Story /> }],
}

/** A single connection renders nothing (count must be > 1). */
export const SingleRendersNothing: Story = {
  decorators: [(Story) => { useEffect(() => { seedConnected(1) }, []); return <Story /> }],
}
