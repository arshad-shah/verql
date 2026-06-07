import type { Meta, StoryObj } from '@storybook/react-vite'
import { PluginStatusSegment } from './PluginStatusSegment'
import { IPC_CHANNELS } from '@shared/ipc'

type PluginEntry = { status: { state: string } }

/**
 * `PluginStatusSegment` derives its state from `usePluginStatus`, which polls
 * `PLUGINS_LIST` over IPC. We override the global `electronAPI.invoke` stub per
 * story so the hook resolves with a controlled plugin list.
 */
function stubPlugins(plugins: PluginEntry[]) {
  ;(window as unknown as { electronAPI: { invoke: (ch: string) => Promise<unknown>; on: () => () => void } }).electronAPI = {
    invoke: async (ch: string) => (ch === IPC_CHANNELS.PLUGINS_LIST ? plugins : undefined),
    on: () => () => {},
  }
}

const active = (n: number): PluginEntry[] => Array.from({ length: n }, () => ({ status: { state: 'active' } }))

const meta: Meta<typeof PluginStatusSegment> = {
  title: 'Components/Shell/StatusBar/PluginStatusSegment',
  component: PluginStatusSegment,
  parameters: { layout: 'centered' },
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

/** All plugins healthy. */
export const AllActive: Story = {
  decorators: [(Story) => { stubPlugins(active(8)); return <Story /> }],
}

/** One plugin failed to load — warning dot + count. */
export const WithFailures: Story = {
  decorators: [
    (Story) => {
      stubPlugins([...active(6), { status: { state: 'error' } }, { status: { state: 'error' } }])
      return <Story />
    },
  ],
}

/** Plugins still in a transitional state — shows the loading spinner. */
export const Loading: Story = {
  decorators: [
    (Story) => {
      stubPlugins([...active(3), { status: { state: 'activating' } }])
      return <Story />
    },
  ],
}
