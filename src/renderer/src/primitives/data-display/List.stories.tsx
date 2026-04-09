import type { Meta, StoryObj } from '@storybook/react'
import { List } from './List'

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
          { label: 'users', icon: '📋' },
          { label: 'orders', icon: '📋' },
          { label: 'products', icon: '📋' },
          { label: 'categories', icon: '📋' },
        ].map(({ label, icon }) => (
          <List.Item key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <span>{icon}</span>
            {label}
          </List.Item>
        ))}
      </List>
    </div>
  ),
}
