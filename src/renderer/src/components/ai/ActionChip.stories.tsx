import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActionChip } from './ActionChip'
import { appActions } from '@/lib/app-actions/registry'

// Register a couple of actions so the chips render in their enabled state.
appActions.register({
  id: 'new-connection', title: 'Add a Connection', description: 'Open the connection form',
  kind: 'navigation', run: () => { /* noop in stories */ }
})
appActions.register({
  id: 'run-sql', title: 'Run SQL', description: 'Run a statement',
  kind: 'mutating', run: () => { /* noop in stories */ }
})

const meta: Meta<typeof ActionChip> = {
  title: 'Components/AI/ActionChip',
  component: ActionChip,
  decorators: [
    (Story) => (
      <div style={{ padding: 16 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof ActionChip>

export const Navigation: Story = {
  args: { actionId: 'new-connection', params: {}, children: 'Add a connection' },
}

export const Mutating: Story = {
  args: { actionId: 'run-sql', params: { sql: 'CREATE INDEX ...' }, children: 'Run CREATE INDEX' },
}

export const Unavailable: Story = {
  args: { actionId: 'does-not-exist', params: {}, children: 'Open something' },
}
