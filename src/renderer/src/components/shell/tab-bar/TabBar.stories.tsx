import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import type { Tab, QueryTab, TableTab, ErDiagramTab, ConnectionFormTab, PluginDetailTab } from '@shared/types'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { TabBar } from './TabBar'

// ---------------------------------------------------------------------------
// Tab factories
// ---------------------------------------------------------------------------

function makeQueryTab(overrides: Partial<QueryTab> = {}): QueryTab {
  return {
    id: 'q1',
    type: 'query',
    title: 'SELECT * FROM users',
    connectionId: 'conn-1',
    schema: 'public',
    sql: 'SELECT * FROM users;',
    results: null,
    isExecuting: false,
    error: null,
    isDirty: false,
    ...overrides,
  }
}

function makeTableTab(overrides: Partial<TableTab> = {}): TableTab {
  return {
    id: 't1',
    type: 'table',
    title: 'users',
    connectionId: 'conn-1',
    tableName: 'users',
    schema: 'public',
    ...overrides,
  }
}

function makeErDiagramTab(overrides: Partial<ErDiagramTab> = {}): ErDiagramTab {
  return {
    id: 'er1',
    type: 'er-diagram',
    title: 'ER Diagram — public',
    connectionId: 'conn-1',
    schema: 'public',
    ...overrides,
  }
}

function makeConnectionFormTab(overrides: Partial<ConnectionFormTab> = {}): ConnectionFormTab {
  return {
    id: 'cf1',
    type: 'connection-form',
    title: 'New Connection',
    ...overrides,
  }
}

function makePluginDetailTab(overrides: Partial<PluginDetailTab> = {}): PluginDetailTab {
  return {
    id: 'pd1',
    type: 'plugin-detail',
    title: 'MongoDB Driver',
    pluginName: 'mongodb',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Store seeding helper
// ---------------------------------------------------------------------------

function seedStores(tabs: Tab[], activeTabId: string | null) {
  useTabsStore.setState({ tabs, activeTabId, recentlyClosed: [] })
  useConnectionsStore.setState({ activeConnectionId: 'conn-1' })
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: 'Components/Shell/TabBar',
  component: TabBar,
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: 900 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TabBar>

export default meta
type Story = StoryObj<typeof meta>

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Single active query tab — the default starting state. */
export const SingleTab: Story = {
  beforeEach: () => {
    const tab = makeQueryTab()
    seedStores([tab], tab.id)
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('SELECT * FROM users')).toBeInTheDocument()
    await expect(canvas.getByLabelText('New Query Tab')).toBeInTheDocument()
  },
}

/** Multiple tabs of mixed types with one active. */
export const MultipleTabs: Story = {
  beforeEach: () => {
    seedStores(
      [
        makeQueryTab({ id: 'q1', title: 'SELECT * FROM users' }),
        makeTableTab({ id: 't1', title: 'orders' }),
        makeErDiagramTab({ id: 'er1', title: 'ER Diagram — public' }),
        makeConnectionFormTab({ id: 'cf1', title: 'New Connection' }),
        makePluginDetailTab({ id: 'pd1', title: 'MongoDB Driver' }),
      ],
      't1',
    )
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('SELECT * FROM users')).toBeInTheDocument()
    await expect(canvas.getByText('orders')).toBeInTheDocument()
    await expect(canvas.getByText('ER Diagram — public')).toBeInTheDocument()
    await expect(canvas.getByText('New Connection')).toBeInTheDocument()
    await expect(canvas.getByText('MongoDB Driver')).toBeInTheDocument()
  },
}

/** A dirty query tab shows the unsaved indicator dot. */
export const DirtyQueryTab: Story = {
  beforeEach: () => {
    seedStores(
      [
        makeQueryTab({ id: 'q1', title: 'Unsaved query', isDirty: true }),
        makeQueryTab({ id: 'q2', title: 'Saved query', isDirty: false }),
      ],
      'q1',
    )
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Unsaved query')).toBeInTheDocument()
    await expect(canvas.getByText('Saved query')).toBeInTheDocument()
  },
}

/** No tabs open — empty bar with just the new-tab button. */
export const EmptyBar: Story = {
  beforeEach: () => {
    seedStores([], null)
  },
  play: async ({ canvas }) => {
    const newBtn = canvas.getByLabelText('New Query Tab')
    await expect(newBtn).toBeInTheDocument()
    await userEvent.click(newBtn)
    // After click, a new query tab should be added via the real store action
    const state = useTabsStore.getState()
    await expect(state.tabs.length).toBe(1)
    await expect(state.tabs[0].type).toBe('query')
  },
}

/** Many tabs to demonstrate overflow state. */
export const ManyTabs: Story = {
  beforeEach: () => {
    const tabs = Array.from({ length: 12 }, (_, i) =>
      makeQueryTab({
        id: `q${i}`,
        title: `Query ${i + 1} — ${['users', 'orders', 'products', 'analytics', 'sessions', 'payments', 'invoices', 'logs', 'events', 'metrics', 'reports', 'backups'][i]}`,
      }),
    )
    seedStores(tabs, 'q0')
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Query 1 — users')).toBeInTheDocument()
  },
}

/** Clicking a tab switches the active tab via the real store. */
export const TabActivation: Story = {
  beforeEach: () => {
    seedStores(
      [
        makeQueryTab({ id: 'q1', title: 'Tab One' }),
        makeTableTab({ id: 't1', title: 'Tab Two' }),
      ],
      'q1',
    )
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('Tab Two'))
    const state = useTabsStore.getState()
    await expect(state.activeTabId).toBe('t1')
  },
}

/** Clicking the close button removes the tab via the real store. */
export const TabClose: Story = {
  beforeEach: () => {
    const tab = makeQueryTab({ id: 'q1', title: 'Closable tab' })
    seedStores([tab], tab.id)
  },
  play: async ({ canvas }) => {
    const closeBtn = canvas.getByLabelText('Close tab')
    await userEvent.click(closeBtn)
    const state = useTabsStore.getState()
    await expect(state.tabs.length).toBe(0)
    await expect(state.recentlyClosed.length).toBe(1)
  },
}

/** All five tab types rendered together to verify icon and color mapping. */
export const AllTabTypes: Story = {
  beforeEach: () => {
    seedStores(
      [
        makeQueryTab({ id: 'q1', title: 'Query' }),
        makeTableTab({ id: 't1', title: 'Table' }),
        makeErDiagramTab({ id: 'er1', title: 'ER Diagram' }),
        makeConnectionFormTab({ id: 'cf1', title: 'Connection Form' }),
        makePluginDetailTab({ id: 'pd1', title: 'Plugin Detail' }),
      ],
      'q1',
    )
  },
}
