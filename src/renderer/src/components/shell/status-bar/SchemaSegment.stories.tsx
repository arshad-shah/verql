import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { fn } from 'storybook/test'
import { SchemaSegment } from './SchemaSegment'
import { useTabsStore } from '@/stores/tabs'
import type { QueryTab } from '@shared/types'

function makeQueryTab(overrides: Partial<QueryTab> = {}): QueryTab {
  return {
    id: 'q1',
    type: 'query',
    title: 'SELECT * FROM users',
    connectionId: 'conn-1',
    schema: 'public',
    sql: 'SELECT 1;',
    results: null,
    isExecuting: false,
    error: null,
    isDirty: false,
    ...overrides,
  }
}

function seed(tab: QueryTab | null) {
  useTabsStore.setState({
    tabs: tab ? [tab] : [],
    activeTabId: tab ? tab.id : null,
  })
}

const meta: Meta<typeof SchemaSegment> = {
  title: 'Components/Shell/StatusBar/SchemaSegment',
  component: SchemaSegment,
  parameters: { layout: 'centered' },
  args: { onClick: fn() },
  decorators: [
    (Story) => (
      <div className="flex h-7 items-stretch bg-bg-primary border border-border-default rounded">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** Active query tab on the `public` schema. */
export const PublicSchema: Story = {
  decorators: [(Story) => { useEffect(() => { seed(makeQueryTab()) }, []); return <Story /> }],
}

/** Active query tab on a custom schema. */
export const CustomSchema: Story = {
  decorators: [(Story) => { useEffect(() => { seed(makeQueryTab({ schema: 'analytics' })) }, []); return <Story /> }],
}

/** No active query tab → renders nothing. */
export const NoQueryTab: Story = {
  decorators: [(Story) => { useEffect(() => { seed(null) }, []); return <Story /> }],
}
