import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { SearchFilter } from './SearchFilter'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'

// SearchFilter is the schema-tree search box. It owns a debounced local value and
// mirrors it into the schema store's `filterText`; when a filter is active and a
// `resultCount` prop is supplied it shows a count badge. The store-seeded stories
// set `filterText` *after* the component's mount effect (which clears it on a
// connection change) so the badge renders. Pattern mirrors AutoCompactBanner.stories.

interface SeedOpts {
  filter?: string
  resultCount?: number
}

function Seeded({ filter, resultCount }: SeedOpts) {
  useEffect(() => {
    useConnectionsStore.setState({ activeConnectionId: 'mock-conn' })
    // The component's own effect resets filterText to '' on mount; re-apply on the
    // next tick so the active-filter state (and count badge) is visible.
    const id = setTimeout(() => useSchemaStore.setState({ filterText: filter ?? '' }), 0)
    return () => clearTimeout(id)
  }, [filter])
  return (
    <div style={{ width: 280 }}>
      <SearchFilter resultCount={resultCount} />
    </div>
  )
}

const meta: Meta<typeof Seeded> = {
  title: 'Components/Explorer/SearchFilter',
  component: Seeded,
}
export default meta
type Story = StoryObj<typeof meta>

/** Empty input — placeholder, no count badge. */
export const Empty: Story = { args: {} }

/** Active filter with a result count badge. */
export const WithResults: Story = { args: { filter: 'user', resultCount: 7 } }

/** Active filter that matched nothing. */
export const NoResults: Story = { args: { filter: 'zzz', resultCount: 0 } }
