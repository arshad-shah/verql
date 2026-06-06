import type { Meta, StoryObj } from '@storybook/react-vite'
import { Panel } from './Panel'

const meta = {
  title: 'Primitives/Surfaces/Panel',
  component: Panel,
} satisfies Meta<typeof Panel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: 16, color: 'var(--color-text-primary)', fontSize: 13 }}>
        Panel content — used as a borderless surface container
      </div>
    ),
    style: { width: 280 },
  },
}

export const Sidebar: Story = {
  render: () => (
    <Panel style={{ width: 200, height: 300, display: 'flex', flexDirection: 'column' }}>
      {['Tables', 'Views', 'Functions', 'Triggers'].map((item) => (
        <div key={item} style={{ padding: '8px 12px', fontSize: 13, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer' }}>
          {item}
        </div>
      ))}
    </Panel>
  ),
}
