export const AVAILABLE_THEMES = ['dark', 'light', 'midnight', 'dracula', 'nord', 'solarized', 'catppuccin'] as const
export type Theme = (typeof AVAILABLE_THEMES)[number]

export interface GeneralSettings {
  queryTimeout: number
  maxHistoryItems: number
  defaultPageSize: number
}

export interface AppearanceSettings {
  theme: Theme
  uiDensity: 'compact' | 'comfortable' | 'spacious'
  sidebarPosition: 'left' | 'right'
  accentColor: string
  sidebarWidth: number
  splitRatio: number
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
}

export interface ConnectionDefaultSettings {
  autoReconnect: boolean
  defaultSslMode: 'disable' | 'prefer' | 'require'
  defaultPorts: Record<string, number>
}

export interface DataDisplaySettings {
  nullDisplay: string
  dateFormat: 'iso' | 'locale' | 'custom'
  numberFormat: 'raw' | 'locale'
  maxColumnWidth: number
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
}

export const defaultSettings: AppSettings = {
  general: {
    queryTimeout: 30,
    maxHistoryItems: 200,
    defaultPageSize: 100,
  },
  appearance: {
    theme: 'dark',
    uiDensity: 'comfortable',
    sidebarPosition: 'left',
    accentColor: '#7c6ff7',
    sidebarWidth: 240,
    splitRatio: 50,
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
  },
  connectionDefaults: {
    autoReconnect: false,
    defaultSslMode: 'prefer',
    defaultPorts: {
      postgresql: 5432,
      mysql: 3306,
      mongodb: 27017,
      redis: 6379,
    },
  },
  dataDisplay: {
    nullDisplay: 'NULL',
    dateFormat: 'iso',
    numberFormat: 'raw',
    maxColumnWidth: 300,
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
  ],
  plugins: {},
}

/** Deep merge user settings with defaults so new keys get defaults automatically */
export function mergeWithDefaults(persisted: Partial<AppSettings>): AppSettings {
  const result = { ...defaultSettings }
  for (const key of Object.keys(defaultSettings) as (keyof AppSettings)[]) {
    if (key === 'keybindings' || key === 'plugins') {
      if (persisted[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(result as any)[key] = persisted[key]
      }
    } else if (persisted[key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(result as any)[key] = { ...(defaultSettings as any)[key], ...(persisted as any)[key] }
    }
  }
  return result
}
