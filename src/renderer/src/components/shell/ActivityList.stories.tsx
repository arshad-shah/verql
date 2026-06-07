import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActivityList } from './ActivityPanel'
import type { ActivityEntry } from '@shared/activity'

const now = Date.now()
const SAMPLE: ActivityEntry[] = [
  { id: '1', ts: now - 500, kind: 'query', level: 'success', title: '42 row(s) · 12ms', detail: 'SELECT * FROM users WHERE active = true', source: 'Prod', durationMs: 12 },
  { id: '2', ts: now - 1500, kind: 'tool-call', level: 'success', title: 'list_tables · 8ms', detail: '{}', source: 'list_tables', durationMs: 8 },
  { id: '3', ts: now - 2600, kind: 'connection', level: 'success', title: 'Connected to Prod', source: 'prod-1' },
  { id: '4', ts: now - 4200, kind: 'query', level: 'error', title: 'Query failed', detail: 'SELECT * FROM nope\n\nrelation "nope" does not exist', source: 'Prod' },
  { id: '5', ts: now - 6000, kind: 'notification', level: 'warn', title: 'Schema cache is stale' },
  { id: '6', ts: now - 9000, kind: 'network', level: 'info', title: 'POST /api/chat (anthropic)', source: 'anthropic' },
  { id: '7', ts: now - 11000, kind: 'log', level: 'debug', title: 'Resolved 9 bundled plugins', detail: 'sqlite, postgresql, mysql, db-tools, ai, core-formats, core-themes, ssh-tunnel, os-notifications', source: 'app:plugins' },
  { id: '8', ts: now - 13000, kind: 'log', level: 'error', title: 'Auto-start failed', detail: 'Error: port 7337 already in use', source: 'app:mcp' },
]

function Harness({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div style={{ height: 460, width: 340 }} className="bg-bg-secondary border border-border">
      <ActivityList entries={entries} onClear={() => {}} />
    </div>
  )
}

const meta: Meta<typeof Harness> = {
  title: 'Shell/ActivityPanel',
  component: Harness,
  parameters: { layout: 'centered' },
}
export default meta

type Story = StoryObj<typeof Harness>

export const Default: Story = { args: { entries: SAMPLE } }
export const Empty: Story = { args: { entries: [] } }
