import type { Meta, StoryObj } from '@storybook/react-vite'
import { KeyValue } from './KeyValue'

const meta = {
  title: 'Primitives/Data Display/KeyValue',
  component: KeyValue,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    align: { control: 'inline-radio', options: ['between', 'start'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    tone: {
      control: 'select',
      options: ['default', 'muted', 'success', 'warning', 'error'],
    },
    monospace: { control: 'boolean' },
    copyable: { control: 'boolean' },
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

export const Vertical: Story = {
  name: 'Vertical (card layout)',
  render: () => (
    <div style={{ width: 320, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16, border: '1px solid var(--color-border-default)', borderRadius: 8 }}>
      <KeyValue orientation="vertical" label="Status" value="Online" tone="success" />
      <KeyValue orientation="vertical" label="Latency" value="14 ms" />
      <KeyValue orientation="vertical" label="Region" value="us-east-1" />
      <KeyValue orientation="vertical" label="Tier" value="Premium" />
    </div>
  ),
}

export const Tones: Story = {
  render: () => (
    <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <KeyValue label="Default" value="—" />
      <KeyValue label="Muted" value="Idle" tone="muted" />
      <KeyValue label="Success" value="Healthy" tone="success" />
      <KeyValue label="Warning" value="Degraded" tone="warning" />
      <KeyValue label="Error" value="Down" tone="error" />
    </div>
  ),
}

export const Monospace: Story = {
  render: () => (
    <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <KeyValue label="Connection ID" value="c7d1f8b2-1a3e-4a5f-9c2b-8e7d6f5a4321" monospace />
      <KeyValue label="Host" value="db-primary.internal.example.com" monospace />
      <KeyValue label="Port" value="5432" monospace />
    </div>
  ),
}

export const Copyable: Story = {
  name: 'Copyable (hover to reveal)',
  render: () => (
    <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <KeyValue label="Host" value="db-primary.internal.example.com" monospace copyable />
      <KeyValue label="Connection ID" value="c7d1f8b2-1a3e-4a5f-9c2b-8e7d6f5a4321" monospace copyable />
      <KeyValue label="Region" value="us-east-1" copyable />
    </div>
  ),
}

export const StartAligned: Story = {
  name: 'Horizontal start-aligned',
  render: () => (
    <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <KeyValue align="start" label="Driver:" value="postgres" />
      <KeyValue align="start" label="Schema:" value="public" />
      <KeyValue align="start" label="Encoding:" value="UTF8" />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <KeyValue size="sm" label="Small" value="Compact dense layout" />
      <KeyValue size="md" label="Medium" value="Comfortable layout" />
    </div>
  ),
}
