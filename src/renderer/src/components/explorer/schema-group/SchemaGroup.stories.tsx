import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { Table2 } from 'lucide-react'
import { SchemaGroup } from './SchemaGroup'
import { useSchemaStore } from '@/stores/schema'

// `SchemaGroup` wraps arbitrary child rows (Tables/Views) in a collapsible header.
// It auto-expands whenever the store's `filterText` is set, so stories seed it.

function useFilter(filter?: string) {
  useEffect(() => {
    useSchemaStore.setState({ filterText: filter ?? '' })
  }, [filter])
}

function Row({ label }: { label: string }) {
  return (
    <div
      className="text-xs py-0.5"
      style={{ paddingLeft: 48, color: 'var(--color-text-secondary)' }}
    >
      {label}
    </div>
  )
}

const meta: Meta = {
  title: 'Components/Explorer/SchemaGroup',
  decorators: [
    (Story) => (
      <div
        style={{
          width: 300,
          padding: '4px 0',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 8,
        }}
      >
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj

/** A `SchemaGroup` wrapping child rows, expanded by default. */
export const TableGroupExpanded: Story = {
  render: () => {
    useFilter('')
    return (
      <SchemaGroup
        storageKey="sb:tables"
        label="Tables"
        count={3}
        icon={<Table2 size={12} style={{ color: 'var(--color-accent)' }} />}
        headerPaddingLeft={24}
        defaultExpanded
      >
        <Row label="users" />
        <Row label="organizations" />
        <Row label="sessions" />
      </SchemaGroup>
    )
  },
}

/** With an active filter, the group force-expands regardless of its stored state. */
export const FilteredAutoExpanded: Story = {
  render: () => {
    useFilter('user')
    return (
      <SchemaGroup
        storageKey="sb:tables-collapsed"
        label="Tables"
        count={2}
        icon={<Table2 size={12} style={{ color: 'var(--color-accent)' }} />}
        headerPaddingLeft={24}
      >
        <Row label="users" />
        <Row label="user_sessions" />
      </SchemaGroup>
    )
  },
}
