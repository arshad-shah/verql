/** Theme identifiers are now contributed by the bundled `core-themes` plugin
 * (and any third-party plugin that registers more). The list lives in the
 * theme registry; this type stays a permissive string so settings can hold
 * any registered theme id without coupling the type system to the bundled
 * set. The renderer's `useTheme()` hook returns the live list. */
export type Theme = string

export interface GeneralSettings {
  queryTimeout: number
  maxHistoryItems: number
  defaultPageSize: number
  /** Ask before closing a tab with unsaved changes. */
  confirmOnUnsavedClose: boolean
  /** Re-open the tabs that were active when the app last quit. */
  restoreTabsOnStartup: boolean
  /** Show a confirmation dialog before running DELETE/DROP/TRUNCATE/UPDATE without WHERE. */
  confirmDestructiveQueries: boolean
}

export type AppearanceMode = 'light' | 'dark' | 'system'

export interface AppearanceSettings {
  /** Theme id the user has explicitly picked. When `appearanceMode` is
   *  `system`, the resolved theme is `lightTheme` or `darkTheme` based on
   *  `prefers-color-scheme` and this field is ignored. */
  theme: Theme
  /** Controls how the active theme is resolved:
   *  - `light` → always render `lightTheme`
   *  - `dark`  → always render `darkTheme`
   *  - `system` → follow the OS color scheme, flipping between the two */
  appearanceMode: AppearanceMode
  /** Preferred theme id when the resolved mode is light. */
  lightTheme: Theme
  /** Preferred theme id when the resolved mode is dark. */
  darkTheme: Theme
  uiDensity: 'compact' | 'comfortable' | 'spacious'
  sidebarPosition: 'left' | 'right'
  accentColor: string
  sidebarWidth: number
  splitRatio: number
  /** Show the status bar at the bottom of the window. */
  showStatusBar: boolean
  /** Use animated transitions for menus, dropdowns, banners. */
  animations: boolean
  /** Show the secondary (right) sidebar. Persisted across sessions. */
  showSecondarySidebar: boolean
  /** Width of the secondary (right) sidebar in pixels. Clamped 220..640. */
  secondarySidebarWidth: number
  /** Show the bottom dock. Persisted across sessions. */
  showBottomDock: boolean
  /** Height of the bottom dock in pixels. Clamped 120..640. */
  bottomDockHeight: number
}

export interface EditorSettings {
  fontSize: number
  fontFamily: string
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  lineNumbers: boolean
  bracketMatching: boolean
  cursorStyle: 'line' | 'block' | 'underline'
  ligatures: boolean
  /** Allow the cursor to move past the end of the file. */
  scrollPastEnd: boolean
  /** Render the cursor with subtle smoothing animation. */
  smoothCursor: boolean
  /** Auto-close brackets/quotes when typing the opening character. */
  autoClosingBrackets: boolean
  /** Highlight the current line. */
  highlightActiveLine: boolean
}

export interface ConnectionDefaultSettings {
  autoReconnect: boolean
  defaultSslMode: 'disable' | 'prefer' | 'require'
}

export interface DataDisplaySettings {
  nullDisplay: string
  dateFormat: 'iso' | 'locale' | 'custom'
  numberFormat: 'raw' | 'locale'
  maxColumnWidth: number
  /** How to render booleans in result grids. */
  booleanDisplay: 'true_false' | 'one_zero' | 'yes_no' | 'checkmark'
  /** Truncate text cells to this many characters; full value in tooltip. */
  truncateTextAt: number
}

export interface KeyBinding {
  id: string
  label: string
  keys: string[]
  category: string
}

export interface AISettings {
  openaiKey: string
  anthropicKey: string
  ollamaEndpoint: string
  activeProvider: string
  activeModel: string
}

export interface MCPSettings {
  enabled: boolean
  port: number
  token: string
}

export interface AppSettings {
  general: GeneralSettings
  appearance: AppearanceSettings
  editor: EditorSettings
  connectionDefaults: ConnectionDefaultSettings
  dataDisplay: DataDisplaySettings
  ai: AISettings
  mcp: MCPSettings
  keybindings: KeyBinding[]
  plugins: Record<string, Record<string, unknown>>
  /** Names of plugins the user has explicitly deactivated. Persisted so the
   *  choice survives app restarts — without this, every boot re-activates
   *  every resolved plugin. */
  disabledPlugins: string[]
}

export const defaultSettings: AppSettings = {
  general: {
    queryTimeout: 30,
    maxHistoryItems: 200,
    defaultPageSize: 100,
    confirmOnUnsavedClose: true,
    restoreTabsOnStartup: true,
    confirmDestructiveQueries: true,
  },
  appearance: {
    theme: 'nightshift',
    appearanceMode: 'dark',
    lightTheme: 'lab',
    darkTheme: 'nightshift',
    uiDensity: 'comfortable',
    sidebarPosition: 'left',
    // Empty means "follow the theme's accent". Setting any non-empty value
    // overrides the theme accent app-wide (and is preserved across theme
    // switches — user opt-in customisation).
    accentColor: '',
    sidebarWidth: 240,
    splitRatio: 50,
    showStatusBar: true,
    animations: true,
    showSecondarySidebar: false,
    secondarySidebarWidth: 320,
    showBottomDock: true,
    bottomDockHeight: 240,
  },
  editor: {
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    tabSize: 2,
    wordWrap: true,
    minimap: false,
    lineNumbers: true,
    bracketMatching: true,
    cursorStyle: 'line',
    ligatures: true,
    scrollPastEnd: false,
    smoothCursor: false,
    autoClosingBrackets: true,
    highlightActiveLine: true,
  },
  connectionDefaults: {
    autoReconnect: false,
    defaultSslMode: 'prefer',
  },
  dataDisplay: {
    nullDisplay: 'NULL',
    dateFormat: 'iso',
    numberFormat: 'raw',
    maxColumnWidth: 300,
    booleanDisplay: 'true_false',
    truncateTextAt: 200,
  },
  ai: {
    openaiKey: '',
    anthropicKey: '',
    ollamaEndpoint: 'http://localhost:11434',
    activeProvider: 'ollama',
    activeModel: '',
  },
  mcp: {
    enabled: false,
    port: 3100,
    token: '',
  },
  keybindings: [
    { id: 'execute-query', label: 'Execute Query', keys: ['Ctrl+Enter', 'Cmd+Enter'], category: 'Query Execution' },
    { id: 'new-tab', label: 'New Tab', keys: ['Ctrl+T', 'Cmd+T'], category: 'Navigation' },
    { id: 'close-tab', label: 'Close Tab', keys: ['Ctrl+W', 'Cmd+W'], category: 'Navigation' },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', keys: ['Ctrl+B', 'Cmd+B'], category: 'Panels' },
    { id: 'command-palette', label: 'Command Palette', keys: ['Ctrl+Shift+P', 'Cmd+Shift+P'], category: 'Navigation' },
    { id: 'focus-editor', label: 'Focus Editor', keys: ['Ctrl+1', 'Cmd+1'], category: 'Editor' },
    { id: 'save-query', label: 'Save Query', keys: ['Ctrl+S', 'Cmd+S'], category: 'Query Execution' },
    { id: 'toggle-secondary-sidebar', label: 'Toggle Secondary Sidebar', keys: ['Ctrl+Alt+B', 'Cmd+Alt+B'], category: 'Panels' },
    { id: 'toggle-bottom-dock', label: 'Toggle Bottom Dock', keys: ['Ctrl+J', 'Cmd+J'], category: 'Panels' },
  ],
  plugins: {},
  disabledPlugins: [],
}

/** Accent values that were the *default* (not user-chosen) in past versions.
 * Cleared on load so users who never customised the accent stop being stuck
 * with the legacy purple after we changed the default. */
const LEGACY_DEFAULT_ACCENTS = new Set([
  '#7c6ff7', // pre-Nightshift purple default
  '#2bd9a3', // 0.4.0 mint shipped briefly before the default went empty
])

/** Deep merge user settings with defaults so new keys get defaults automatically */
export function mergeWithDefaults(persisted: Partial<AppSettings>): AppSettings {
  const result = { ...defaultSettings }
  for (const key of Object.keys(defaultSettings) as (keyof AppSettings)[]) {
    if (key === 'keybindings' || key === 'plugins' || key === 'disabledPlugins') {
      if (persisted[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(result as any)[key] = persisted[key]
      }
    } else if (persisted[key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(result as any)[key] = { ...(defaultSettings as any)[key], ...(persisted as any)[key] }
    }
  }
  // Migration: clear a previously-default accent so theme accent takes over.
  if (
    result.appearance.accentColor &&
    LEGACY_DEFAULT_ACCENTS.has(result.appearance.accentColor.toLowerCase())
  ) {
    result.appearance.accentColor = ''
  }
  return result
}
