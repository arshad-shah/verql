import type { Meta, StoryObj } from '@storybook/react-vite'
import { Table2 } from 'lucide-react'
import { GroupHeader } from './GroupHeader'

// The collapsible header row shared by every schema sub-category group. Pure
// presentational: caller owns the expanded state and toggle handler.
const meta: Meta<typeof GroupHeader> = {
  title: 'Components/Explorer/GroupHeader',
  component: GroupHeader,
  args: {
    label: 'Tables',
    count: 12,
    onToggle: () => {},
    paddingLeft: 24,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 300,
          padding: '4px 0',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 8,
        }}
      >
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** Expanded — shows the down chevron. */
export const Expanded: Story = {
  args: { expanded: true },
}

/** Collapsed — shows the right chevron. */
export const Collapsed: Story = {
  args: { expanded: false },
}

/** With a leading category icon. */
export const WithIcon: Story = {
  args: {
    expanded: true,
    icon: <Table2 size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />,
  },
}
