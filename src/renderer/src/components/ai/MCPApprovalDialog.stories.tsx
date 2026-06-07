import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { MCPApprovalDialog } from './MCPApprovalDialog'
import { useAIStore } from '@/stores/ai'
import type { MCPApprovalRequest } from '@shared/mcp'

function stubElectronAPI() {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => undefined,
    on: () => () => {},
  }
}

function seed(req: MCPApprovalRequest | null) {
  return function StoreSeeder() {
    useEffect(() => {
      stubElectronAPI()
      useAIStore.setState({ mcpPendingApproval: req })
    }, [])
    return <MCPApprovalDialog />
  }
}

const meta: Meta<typeof MCPApprovalDialog> = {
  title: 'Components/AI/MCPApprovalDialog',
  component: MCPApprovalDialog,
}
export default meta
type Story = StoryObj<typeof meta>

export const WriteRequest: Story = {
  render: seed({
    requestId: 'req-1',
    toolId: 'execute_query',
    toolName: 'execute_query',
    sql: 'DELETE FROM sessions WHERE expires_at < now();',
    permission: 'write',
  }),
}

export const ReadRequest: Story = {
  render: seed({
    requestId: 'req-2',
    toolId: 'execute_query',
    toolName: 'execute_query',
    sql: 'SELECT id, email FROM users ORDER BY created_at DESC LIMIT 50;',
    permission: 'read',
  }),
}

export const Hidden: Story = {
  render: seed(null),
}
