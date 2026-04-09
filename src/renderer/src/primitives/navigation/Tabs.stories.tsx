import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { useState } from 'react'
import { Tabs } from './Tabs'

const meta = {
  title: 'Primitives/Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  args: {
    onTabChange: fn(),
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

const TABS = [
  { id: 'data', label: 'Data' },
  { id: 'schema', label: 'Schema' },
  { id: 'indexes', label: 'Indexes' },
  { id: 'constraints', label: 'Constraints' },
]

const TWO_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'settings', label: 'Settings' },
]

const MANY_TABS = [
  { id: 'data', label: 'Data' },
  { id: 'schema', label: 'Schema' },
  { id: 'indexes', label: 'Indexes' },
  { id: 'constraints', label: 'Constraints' },
  { id: 'triggers', label: 'Triggers' },
  { id: 'policies', label: 'Policies' },
  { id: 'stats', label: 'Statistics' },
]

export const Default: Story = {
  render: function Render() {
    const [active, setActive] = useState('data')
    return (
      <div style={{ width: 480 }}>
        <Tabs tabs={TABS} activeTab={active} onTabChange={setActive} />
        <div style={{ padding: '12px 4px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Active tab: <strong style={{ color: 'var(--color-text-primary)' }}>{active}</strong>
        </div>
      </div>
    )
  },
  play: async ({ canvas }) => {
    const schemaTab = canvas.getByRole('tab', { name: 'Schema' })
    await userEvent.click(schemaTab)
    await expect(schemaTab).toHaveAttribute('aria-selected', 'true')

    const indexesTab = canvas.getByRole('tab', { name: 'Indexes' })
    await userEvent.click(indexesTab)
    await expect(indexesTab).toHaveAttribute('aria-selected', 'true')
  },
}

export const States: Story = {
  render: function Render() {
    const [activeTwoTab, setActiveTwoTab] = useState('overview')
    const [activeManyTab, setActiveManyTab] = useState('data')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: 560 }}>
        <div>
          <p style={{ fontSize: 12, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Minimal (two tabs)</p>
          <Tabs tabs={TWO_TABS} activeTab={activeTwoTab} onTabChange={setActiveTwoTab} />
        </div>

        <div>
          <p style={{ fontSize: 12, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Many tabs (7) — overflow behavior</p>
          <Tabs tabs={MANY_TABS} activeTab={activeManyTab} onTabChange={setActiveManyTab} />
        </div>
      </div>
    )
  },
}
