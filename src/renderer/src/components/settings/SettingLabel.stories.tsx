import type { Meta, StoryObj } from '@storybook/react-vite'
import { SettingLabel } from './SettingLabel'

// SettingLabel is purely prop-driven: a primary label with an optional muted
// description. It's the left half of every settings row.
const meta: Meta<typeof SettingLabel> = {
  title: 'Components/Settings/SettingLabel',
  component: SettingLabel,
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** Label with a supporting description — the common case. */
export const WithDescription: Story = {
  args: {
    label: 'Restore tabs on startup',
    description: 'Reopen the query tabs you had open when you last closed Verql.',
  },
}

/** Label only — used when the control speaks for itself. */
export const LabelOnly: Story = {
  args: {
    label: 'Confirm before running destructive queries',
  },
}

/** Long description that wraps within the constrained row width. */
export const LongDescription: Story = {
  args: {
    label: 'Maximum history items',
    description:
      'The number of recorded query runs Verql keeps before the oldest entries are pruned from your local history database.',
  },
}
