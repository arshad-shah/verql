import type { Meta, StoryObj } from '@storybook/react'
import { Label } from './Label'

const meta = {
  title: 'Forms/Label',
  component: Label,
  tags: ['autodocs'],
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: 'Database host',
  },
}

export const WithInput: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 240 }}>
      <Label htmlFor="host-input">Database host</Label>
      <input
        id="host-input"
        type="text"
        placeholder="localhost"
        style={{ height: 32, padding: '0 12px', fontSize: 13, border: '1px solid var(--color-border-default)', borderRadius: 6, background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', outline: 'none' }}
      />
    </div>
  ),
}
