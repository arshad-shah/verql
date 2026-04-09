import type { Meta, StoryObj } from '@storybook/react-vite'
import { List } from './List'
import { Table2 } from 'lucide-react'

const meta = {
  title: 'Primitives/Data Display/List',
  component: List,
  tags: ['autodocs'],
} satisfies Meta<typeof List>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ width: 240, border: '1px solid var(--color-border-default)', borderRadius: 8, overflow: 'hidden' }}>
      <List>
        {['Tables', 'Views', 'Indexes', 'Functions', 'Triggers', 'Sequences'].map((item) => (
          <List.Item key={item} style={{ cursor: 'pointer', borderBottom: '1px solid var(--color-border-subtle)' }}>
            {item}
          </List.Item>
        ))}
      </List>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div style={{ width: 240, border: '1px solid var(--color-border-default)', borderRadius: 8, overflow: 'hidden' }}>
      <List>
        {[
          { label: 'users' },
          { label: 'orders' },
          { label: 'products' },
          { label: 'categories' },
        ].map(({ label }) => (
          <List.Item key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <Table2 size={14} className="text-accent" />
            {label}
          </List.Item>
        ))}
      </List>
    </div>
  ),
}
