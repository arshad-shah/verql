import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { UpdatesSection } from './UpdatesSection'
import { IPC_CHANNELS } from '@shared/ipc'

// UpdatesSection detects a managed installer over IPC on mount and renders
// update controls only when one is present (otherwise it returns null). Each
// story overrides window.electronAPI to simulate a different updater state.
// `on` is captured so we could push progress events, but the default flow is
// driven purely by the invoke responses.
type InvokeMap = Record<string, () => unknown>

function stubElectronAPI(map: InvokeMap) {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async (channel: string) => map[channel]?.(),
    on: () => () => {},
  }
}

/** Wait for the mount-time detection to resolve before rendering the section. */
function Mounted({ map }: { map: InvokeMap }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    stubElectronAPI(map)
    setReady(true)
  }, [map])
  if (!ready) return null
  return (
    <div style={{ width: 520 }}>
      <UpdatesSection />
    </div>
  )
}

const meta: Meta<typeof UpdatesSection> = {
  title: 'Components/Settings/UpdatesSection',
  component: UpdatesSection,
}
export default meta
type Story = StoryObj<typeof meta>

const HOMEBREW_STATUS = {
  available: true,
  displayName: 'Homebrew',
  currentVersion: '1.4.2',
}

/** Managed install, up to date — only the "Check for updates" button shows. */
export const UpToDate: Story = {
  render: () => (
    <Mounted
      map={{
        [IPC_CHANNELS.UPDATER_STATUS]: () => HOMEBREW_STATUS,
        [IPC_CHANNELS.UPDATER_CHECK]: () => ({
          supported: true,
          currentVersion: '1.4.2',
          latestVersion: '1.4.2',
          available: false,
        }),
      }}
    />
  ),
}

/**
 * After a check finds a newer version: the "Install update" button appears and
 * the description shows the version delta. Click "Check for updates" to reach
 * this state from the rendered story.
 */
export const UpdateAvailable: Story = {
  render: () => (
    <Mounted
      map={{
        [IPC_CHANNELS.UPDATER_STATUS]: () => HOMEBREW_STATUS,
        [IPC_CHANNELS.UPDATER_CHECK]: () => ({
          supported: true,
          currentVersion: '1.4.2',
          latestVersion: '1.5.0',
          available: true,
        }),
        [IPC_CHANNELS.UPDATER_UPDATE]: () => undefined,
      }}
    />
  ),
}
