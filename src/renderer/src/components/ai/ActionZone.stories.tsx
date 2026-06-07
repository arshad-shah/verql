import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { ActionZone } from './ActionZone'
import { useAIStore } from '@/stores/ai'
import type { AIApprovalRequest } from '@shared/ai-types'

function stubElectronAPI() {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => undefined,
    on: () => () => {},
  }
}

function seed(patch: { pendingApproval?: AIApprovalRequest | null; permissionProfile?: 'read-only' | 'ask-write' | 'auto' }) {
  return function StoreSeeder() {
    useEffect(() => {
      stubElectronAPI()
      useAIStore.setState({
        pendingApproval: patch.pendingApproval ?? null,
        permissionProfile: patch.permissionProfile ?? 'ask-write',
      })
    }, [])
    return <ActionZone />
  }
}

const meta: Meta<typeof ActionZone> = {
  title: 'Components/AI/ActionZone',
  component: ActionZone,
  decorators: [
    (Story) => (
      <div style={{ width: 380, background: 'var(--color-bg-primary)' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

export const Composer: Story = { render: seed({}) }

export const WithPendingApproval: Story = {
  render: seed({
    pendingApproval: {
      requestId: 'req-1',
      toolName: 'execute_query',
      toolDescription: 'Execute a SQL query against the database',
      parameters: { sql: 'DELETE FROM orders WHERE status = \'cancelled\';' },
      display: "DELETE FROM orders WHERE status = 'cancelled';",
    },
  }),
}

export const AutoMode: Story = { render: seed({ permissionProfile: 'auto' }) }
