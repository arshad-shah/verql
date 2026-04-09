import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { TreeItem } from './TreeItem'
import { Table2, Eye, Key, Link, Hash } from 'lucide-react'

const meta = {
  title: 'Primitives/Data Display/TreeItem',
  component: TreeItem,
  tags: ['autodocs'],
} satisfies Meta<typeof TreeItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(true)
    return (
      <div style={{ width: 260, border: '1px solid var(--color-border-default)', borderRadius: 8, padding: '4px 0', overflow: 'hidden' }}>
        <TreeItem
          label="users"
          icon={<Table2 size={12} className="text-accent" />}
          depth={0}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          meta="1.2k"
        >
          <TreeItem label="id" icon={<Key size={11} className="text-warning" />} depth={1} meta="integer" />
          <TreeItem label="email" icon={<Hash size={11} className="text-text-muted" />} depth={1} meta="varchar(255)" />
          <TreeItem label="org_id" icon={<Link size={11} className="text-info" />} depth={1} meta="uuid" />
        </TreeItem>
        <TreeItem
          label="organizations"
          icon={<Table2 size={12} className="text-accent" />}
          depth={0}
          expanded={false}
          onToggle={() => {}}
          meta="48"
        />
        <TreeItem
          label="active_users"
          icon={<Eye size={12} className="text-info" />}
          depth={0}
          expanded={false}
          onToggle={() => {}}
        />
      </div>
    )
  },
}

export const Selected: Story = {
  render: () => (
    <div style={{ width: 260, border: '1px solid var(--color-border-default)', borderRadius: 8, padding: '4px 0', overflow: 'hidden' }}>
      <TreeItem label="users" icon={<Table2 size={12} className="text-accent" />} depth={0} selected onToggle={() => {}} />
      <TreeItem label="organizations" icon={<Table2 size={12} className="text-accent" />} depth={0} onToggle={() => {}} />
      <TreeItem label="sessions" icon={<Table2 size={12} className="text-accent" />} depth={0} onToggle={() => {}} />
    </div>
  ),
}

export const DeepNesting: Story = {
  render: () => (
    <div style={{ width: 300, border: '1px solid var(--color-border-default)', borderRadius: 8, padding: '4px 0', overflow: 'hidden' }}>
      <TreeItem label="Level 0" depth={0} expanded onToggle={() => {}}>
        <TreeItem label="Level 1" depth={1} expanded onToggle={() => {}}>
          <TreeItem label="Level 2" depth={2} expanded onToggle={() => {}}>
            <TreeItem label="Leaf at depth 3" depth={3} />
          </TreeItem>
        </TreeItem>
      </TreeItem>
    </div>
  ),
}
