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
