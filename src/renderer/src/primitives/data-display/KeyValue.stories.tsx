import type { Meta, StoryObj } from '@storybook/react'
import { KeyValue } from './KeyValue'

const meta = {
  title: 'Primitives/Data Display/KeyValue',
  component: KeyValue,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
  },
} satisfies Meta<typeof KeyValue>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Database',
    value: 'PostgreSQL 15.3',
  },
  decorators: [(Story) => <div style={{ width: 280 }}><Story /></div>],
}

export const List: Story = {
  render: () => (
    <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid var(--color-border-default)', borderRadius: 8 }}>
      <KeyValue label="Host" value="localhost" />
      <KeyValue label="Port" value="5432" />
      <KeyValue label="Database" value="my_db" />
      <KeyValue label="SSL" value="Enabled" />
      <KeyValue label="Max connections" value="100" />
    </div>
  ),
}
