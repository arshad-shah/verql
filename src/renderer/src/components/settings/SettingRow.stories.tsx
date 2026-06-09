import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SettingRow } from './SettingRow'
import { Button } from '@arshad-shah/cynosure-react/button'
import { Switch, Input } from '@/primitives'

// SettingRow lays out a labelled setting: SettingLabel on the left, an
// arbitrary control on the right. It's prop-driven (label/description/children),
// so the stories just pair it with a realistic primitive control.
const meta: Meta<typeof SettingRow> = {
  title: 'Components/Settings/SettingRow',
  component: SettingRow,
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

function ToggleRow() {
  const [on, setOn] = useState(true)
  return (
    <SettingRow
      label="Restore tabs on startup"
      description="Reopen the query tabs you had open when you last closed Verql."
    >
      <Switch
        label="Restore tabs on startup"
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
      />
    </SettingRow>
  )
}

/** A boolean setting with a Switch control. */
export const WithSwitch: Story = {
  render: () => <ToggleRow />,
}

/** A text setting with an Input control. */
export const WithInput: Story = {
  render: () => (
    <SettingRow
      label="Default schema"
      description="The schema selected when you open a new connection."
    >
      <Input defaultValue="public" style={{ width: 160 }} />
    </SettingRow>
  ),
}

/** A row whose control is an action button rather than a value editor. */
export const WithButton: Story = {
  render: () => (
    <SettingRow
      label="Reset keybindings"
      description="Restore every keyboard shortcut to its default binding."
    >
      <Button variant="outline" colorScheme="neutral" size="sm">
        Reset
      </Button>
    </SettingRow>
  ),
}
