import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { PermissionModeRow } from './PermissionModeRow'
import { useAIStore } from '@/stores/ai'

function stubElectronAPI() {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => undefined,
    on: () => () => {},
  }
}

function seed(profile: 'read-only' | 'ask-write' | 'auto') {
  return function StoreSeeder() {
    useEffect(() => {
      stubElectronAPI()
      useAIStore.setState({ permissionProfile: profile })
    }, [])
    return <PermissionModeRow />
  }
}

const meta: Meta<typeof PermissionModeRow> = {
  title: 'Components/AI/PermissionModeRow',
  component: PermissionModeRow,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 320, background: 'var(--color-bg-secondary)' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

export const ReadOnly: Story = { render: seed('read-only') }
export const AskWrite: Story = { render: seed('ask-write') }
export const Auto: Story = { render: seed('auto') }
