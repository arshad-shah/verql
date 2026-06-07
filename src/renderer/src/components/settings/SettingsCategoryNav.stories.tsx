import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { SettingsCategoryNav } from './SettingsCategoryNav'
import { useUiStore } from '@/stores/ui'
import {
  SETTINGS_CATEGORY,
  SETTINGS_CATEGORIES,
  type SettingsCategoryDef,
} from '@/lib/settings-categories'

// SettingsCategoryNav reads the active category from the ui store and queries
// the plugin list over IPC to hide categories whose owning plugin isn't active.
// Stories stub electronAPI to control which plugins report as active, mirroring
// the AutoCompactBanner store-seeding pattern.
type ActivePlugin = { name: string; status: { state: string } }

function stubElectronAPI(activePlugins: ActivePlugin[]) {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => activePlugins,
    on: () => () => {},
  }
}

function withNav(opts: {
  active: (typeof SETTINGS_CATEGORY)[keyof typeof SETTINGS_CATEGORY]
  plugins?: ActivePlugin[]
  categories?: SettingsCategoryDef[]
}) {
  return function NavSeeder() {
    useEffect(() => {
      stubElectronAPI(opts.plugins ?? [])
      useUiStore.setState({ activeSettingsCategory: opts.active })
    }, [])
    return (
      <div style={{ width: 220 }}>
        <SettingsCategoryNav categories={opts.categories} />
      </div>
    )
  }
}

const meta: Meta<typeof SettingsCategoryNav> = {
  title: 'Components/Settings/SettingsCategoryNav',
  component: SettingsCategoryNav,
}
export default meta
type Story = StoryObj<typeof meta>

/** Default nav with the AI plugin active, so every category is visible. */
export const Default: Story = {
  render: withNav({
    active: SETTINGS_CATEGORY.GENERAL,
    plugins: [{ name: 'verql-plugin-ai', status: { state: 'active' } }],
  }),
}

/** A non-default category selected — the active item is highlighted. */
export const KeybindingsActive: Story = {
  render: withNav({
    active: SETTINGS_CATEGORY.KEYBINDINGS,
    plugins: [{ name: 'verql-plugin-ai', status: { state: 'active' } }],
  }),
}

/** AI plugin inactive — its category is hidden without a restart. */
export const AiPluginDisabled: Story = {
  render: withNav({
    active: SETTINGS_CATEGORY.GENERAL,
    plugins: [],
  }),
}

/** A pre-filtered list (the settings search box passes `categories`). */
export const SearchFiltered: Story = {
  render: withNav({
    active: SETTINGS_CATEGORY.APPEARANCE,
    plugins: [{ name: 'verql-plugin-ai', status: { state: 'active' } }],
    categories: SETTINGS_CATEGORIES.filter((c) =>
      [SETTINGS_CATEGORY.APPEARANCE, SETTINGS_CATEGORY.EDITOR].includes(
        c.id as 'appearance' | 'editor'
      )
    ),
  }),
}
