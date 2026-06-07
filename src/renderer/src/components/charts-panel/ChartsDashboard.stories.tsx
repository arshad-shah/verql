import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { ChartsDashboard } from './ChartsDashboard'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import type { QueryResult, QueryTab } from '@shared/types'

const result = (rowCount: number): QueryResult => ({
  rows: [],
  fields: [
    { name: 'region', dataType: 'text', nullable: false },
    { name: 'revenue', dataType: 'numeric', nullable: false },
  ],
  rowCount,
  duration: 12,
  affectedRows: 0,
})

const queryTab = (
  id: string,
  title: string,
  sql: string,
  results: QueryResult | null,
): QueryTab => ({
  id,
  type: 'query',
  title,
  connectionId: 'conn-1',
  database: 'app',
  schema: 'public',
  sql,
  results,
  isExecuting: false,
  error: null,
  isDirty: false,
  aiExplanation: null,
})

function seed(tabs: QueryTab[]) {
  return function Seeder() {
    useEffect(() => {
      useConnectionsStore.setState({ activeConnectionId: 'conn-1' })
      useTabsStore.setState({ tabs })
    }, [])
    return <ChartsDashboard />
  }
}

const meta: Meta<typeof ChartsDashboard> = {
  title: 'Components/ChartsPanel/ChartsDashboard',
  component: ChartsDashboard,
  decorators: [
    (Story) => (
      <div style={{ width: 320, height: 360 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** Several query tabs with results — each becomes a "jump to chart" entry. */
export const WithResults: Story = {
  render: seed([
    queryTab('t1', 'Revenue by region', 'SELECT region, SUM(amount) AS revenue FROM sales GROUP BY region ORDER BY revenue DESC', result(4)),
    queryTab('t2', 'Signups per day', 'SELECT day, COUNT(*) AS signups FROM users GROUP BY day', result(30)),
  ]),
}

/** No query tabs with results — renders the empty state. */
export const Empty: Story = {
  render: seed([queryTab('t3', 'Pending query', 'SELECT 1', null)]),
}
