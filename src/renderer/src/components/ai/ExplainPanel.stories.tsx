import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { ExplainPanel } from './ExplainPanel'
import { useExplainStore } from '@/stores/explain'
import type { QueryResult } from '@shared/types'

function stubElectronAPI() {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => ({ streamId: 's1', model: 'claude-opus' }),
    on: () => () => {},
  }
}

const results: QueryResult = {
  rows: [
    { id: 1, name: 'Ada', orders: 12 },
    { id: 2, name: 'Linus', orders: 7 },
  ],
  fields: [
    { name: 'id', dataType: 'int4' },
    { name: 'name', dataType: 'text' },
    { name: 'orders', dataType: 'int8' },
  ] as QueryResult['fields'],
  rowCount: 2,
  duration: 14,
  affectedRows: 0,
}

function seed(patch: { tabId: string; loading?: boolean; explanation?: string | null }) {
  return function StoreSeeder() {
    useEffect(() => {
      stubElectronAPI()
      if (patch.loading) {
        useExplainStore.getState().startStream(patch.tabId, 's1', 'claude-opus')
      } else {
        useExplainStore.setState({ byTab: {} })
      }
    }, [])
    return (
      <ExplainPanel
        tabId={patch.tabId}
        sql="SELECT u.name, count(o.id) AS orders FROM users u JOIN orders o ON o.user_id = u.id GROUP BY u.name;"
        results={results}
        explanation={patch.explanation ?? null}
      />
    )
  }
}

const meta: Meta<typeof ExplainPanel> = {
  title: 'Components/AI/ExplainPanel',
  component: ExplainPanel,
  decorators: [
    (Story) => (
      <div style={{ padding: 16 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = { render: seed({ tabId: 'tab-idle' }) }
export const HasExplanation: Story = { render: seed({ tabId: 'tab-done', explanation: 'This query joins users and orders…' }) }
export const Loading: Story = { render: seed({ tabId: 'tab-loading', loading: true }) }
