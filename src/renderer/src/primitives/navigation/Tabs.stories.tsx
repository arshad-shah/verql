import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Tabs } from './Tabs'

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

const TABS = [
  { id: 'data', label: 'Data' },
  { id: 'schema', label: 'Schema' },
  { id: 'indexes', label: 'Indexes' },
  { id: 'constraints', label: 'Constraints' },
]

export const Interactive: Story = {
  render: () => {
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
}
