import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { FunctionSquare, KeySquare } from 'lucide-react'
import { SchemaObjectGroup, type SchemaObjectGroupItem } from './SchemaObjectGroup'
import { useSchemaStore } from '@/stores/schema'

// `SchemaObjectGroup` renders a flat list of labelled items (functions, indexes, …)
// inside a collapsible header. It auto-expands whenever the store's `filterText` is
// set and highlights matching item labels, so the filter-driven stories seed it.

function useFilter(filter?: string) {
  useEffect(() => {
    useSchemaStore.setState({ filterText: filter ?? '' })
  }, [filter])
}

const meta: Meta = {
  title: 'Components/Explorer/SchemaObjectGroup',
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

const objectItems: SchemaObjectGroupItem[] = [
  { key: 'fn1', label: 'user_count()', sub: 'returns integer' },
  { key: 'fn2', label: 'send_invite(text, uuid)' },
  { key: 'fn3', label: 'refresh_mrr()', sub: 'returns void' },
]

/** A `SchemaObjectGroup` of functions with secondary (sub) text. */
export const ObjectGroupCollapsed: Story = {
  render: () => {
    useFilter('')
    return (
      <SchemaObjectGroup
        storageKey="sb:functions"
        label="Functions"
        items={objectItems}
        icon={<FunctionSquare size={12} style={{ color: 'var(--color-info)' }} />}
        headerPaddingLeft={24}
        itemPaddingLeft={48}
      />
    )
  },
}

/** With an active filter, groups force-expand and item labels are highlighted. */
export const FilteredAutoExpanded: Story = {
  render: () => {
    useFilter('user')
    return (
      <SchemaObjectGroup
        storageKey="sb:indexes"
        label="Indexes"
        items={[
          { key: 'i1', label: 'users_pkey', sub: 'on users' },
          { key: 'i2', label: 'users_email_idx', sub: 'on users' },
        ]}
        icon={<KeySquare size={12} style={{ color: 'var(--color-warning)' }} />}
        headerPaddingLeft={24}
        itemPaddingLeft={48}
      />
    )
  },
}

/** Empty groups render nothing (items length is 0). */
export const Empty: Story = {
  render: () => {
    useFilter('')
    return (
      <SchemaObjectGroup
        storageKey="sb:empty"
        label="Sequences"
        items={[]}
        icon={<KeySquare size={12} style={{ color: 'var(--color-text-tertiary)' }} />}
        headerPaddingLeft={24}
        itemPaddingLeft={48}
      />
    )
  },
}
