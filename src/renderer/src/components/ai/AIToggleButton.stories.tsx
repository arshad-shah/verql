import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { AIToggleButton } from './AIToggleButton'
import { useUiStore } from '@/stores/ui'

function stubElectronAPI() {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => undefined,
    on: () => () => {},
  }
}

function seed(open: boolean) {
  return function StoreSeeder() {
    useEffect(() => {
      stubElectronAPI()
      useUiStore.setState({
        secondarySidebarVisible: open,
        secondaryActivePanel: open ? 'plugin:ai-chat' : 'inspector',
      })
    }, [])
    return <AIToggleButton />
  }
}

const meta: Meta<typeof AIToggleButton> = {
  title: 'Components/AI/AIToggleButton',
  component: AIToggleButton,
}
export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = { render: seed(false) }
export const Open: Story = { render: seed(true) }
