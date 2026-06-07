import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { QueryToolbar } from './QueryToolbar'

// QueryToolbar is prop-driven: Run/Cancel (toggled by isExecuting) + Explain,
// plus a trailing slot for plugin-contributed toolbar widgets. It pulls toolbar
// contributions from the plugin-ui store on mount; with the global electronAPI
// stub that fetch is a harmless no-op (no plugin widgets), so no seeding needed.

const meta: Meta<typeof QueryToolbar> = {
  title: 'Components/Query/QueryToolbar',
  component: QueryToolbar,
  decorators: [
    (Story) => (
      <div style={{ width: 520, maxWidth: '100%' }} className="bg-bg-secondary px-3 py-1.5">
        <Story />
      </div>
    ),
  ],
  args: {
    onExecute: fn(),
    onCancel: fn(),
    onExplain: fn(),
  },
}
export default meta
type Story = StoryObj<typeof meta>

/** Idle state — shows Run (success) and Explain. */
export const Idle: Story = {
  args: {
    isExecuting: false,
    connectionType: 'postgresql',
  },
}

/** A query is running — Run is replaced by a spinning Cancel button and
 *  Explain is disabled. */
export const Executing: Story = {
  args: {
    isExecuting: true,
    connectionType: 'postgresql',
  },
}

/** No connection type — plugin toolbar widgets never mount; bare Run/Explain. */
export const NoConnectionType: Story = {
  args: {
    isExecuting: false,
  },
}
