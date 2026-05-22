import type { Monaco } from '@monaco-editor/react'

interface ThemeDef {
  base: 'vs' | 'vs-dark'
  colors: Record<string, string>
  rules: Array<{ token: string; foreground: string; fontStyle?: string }>
}

const themes: Record<string, ThemeDef> = {
  'verql-nightshift': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#0B0F16',
      'editor.foreground': '#E8ECF3',
      'editor.lineHighlightBackground': '#E8ECF30A',
      'editor.selectionBackground': '#2BD9A340',
      'editorLineNumber.foreground': '#4A5468',
      'editorCursor.foreground': '#2BD9A3',
      'editor.selectionHighlightBackground': '#2BD9A320',
      'editorBracketMatch.background': '#2BD9A330',
      'editorBracketMatch.border': '#2BD9A350',
    },
    rules: [
      { token: 'keyword', foreground: '#2BD9A3' },
      { token: 'string', foreground: '#FFB23D' },
      { token: 'number', foreground: '#FFC061' },
      { token: 'comment', foreground: '#4A5468', fontStyle: 'italic' },
      { token: 'type', foreground: '#5CE0BD' },
      { token: 'identifier', foreground: '#E8ECF3' },
      { token: 'operator', foreground: '#7C8499' },
      { token: 'delimiter', foreground: '#B8C0D1' },
    ],
  },
  'verql-lab': {
    base: 'vs',
    colors: {
      'editor.background': '#FAFAF6',
      'editor.foreground': '#1A1A1C',
      'editor.lineHighlightBackground': '#1A1A1C08',
      'editor.selectionBackground': '#115E5930',
      'editorLineNumber.foreground': '#BFBDB4',
      'editorCursor.foreground': '#115E59',
      'editor.selectionHighlightBackground': '#115E5915',
      'editorBracketMatch.background': '#115E5920',
      'editorBracketMatch.border': '#115E5940',
    },
    rules: [
      { token: 'keyword', foreground: '#115E59' },
      { token: 'string', foreground: '#B45309' },
      { token: 'number', foreground: '#9A4F0B' },
      { token: 'comment', foreground: '#6B6B68', fontStyle: 'italic' },
      { token: 'type', foreground: '#14716A' },
      { token: 'identifier', foreground: '#1A1A1C' },
      { token: 'operator', foreground: '#6B6B68' },
      { token: 'delimiter', foreground: '#1A1A1C' },
    ],
  },
  'verql-inkpaper': {
    base: 'vs',
    colors: {
      'editor.background': '#F8F2E5',
      'editor.foreground': '#14110F',
      'editor.lineHighlightBackground': '#14110F08',
      'editor.selectionBackground': '#9E302230',
      'editorLineNumber.foreground': '#BFB29A',
      'editorCursor.foreground': '#9E3022',
      'editor.selectionHighlightBackground': '#9E302215',
      'editorBracketMatch.background': '#9E302220',
      'editorBracketMatch.border': '#9E302240',
    },
    rules: [
      { token: 'keyword', foreground: '#9E3022' },
      { token: 'string', foreground: '#6B4226' },
      { token: 'number', foreground: '#8E5A1E' },
      { token: 'comment', foreground: '#6D6759', fontStyle: 'italic' },
      { token: 'type', foreground: '#B23A2A' },
      { token: 'identifier', foreground: '#14110F' },
      { token: 'operator', foreground: '#6D6759' },
      { token: 'delimiter', foreground: '#14110F' },
    ],
  },
  'verql-dark': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#0d0d1a',
      'editor.foreground': '#ffffff',
      'editor.lineHighlightBackground': '#ffffff0d',
      'editor.selectionBackground': '#7c6ff740',
      'editorLineNumber.foreground': '#666666',
      'editorCursor.foreground': '#7c6ff7',
      'editor.selectionHighlightBackground': '#7c6ff720',
      'editorBracketMatch.background': '#7c6ff730',
      'editorBracketMatch.border': '#7c6ff750',
    },
    rules: [
      { token: 'keyword', foreground: '#c678dd' },
      { token: 'string', foreground: '#98c379' },
      { token: 'number', foreground: '#d19a66' },
      { token: 'comment', foreground: '#5c6370', fontStyle: 'italic' },
      { token: 'type', foreground: '#e5c07b' },
      { token: 'identifier', foreground: '#61afef' },
      { token: 'operator', foreground: '#56b6c2' },
      { token: 'delimiter', foreground: '#abb2bf' },
    ],
  },
  'verql-light': {
    base: 'vs',
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#0d0d1a',
      'editor.lineHighlightBackground': '#0000000a',
      'editor.selectionBackground': '#7c6ff730',
      'editorLineNumber.foreground': '#888888',
      'editorCursor.foreground': '#7c6ff7',
      'editor.selectionHighlightBackground': '#7c6ff715',
      'editorBracketMatch.background': '#7c6ff720',
      'editorBracketMatch.border': '#7c6ff740',
    },
    rules: [
      { token: 'keyword', foreground: '#a626a4' },
      { token: 'string', foreground: '#50a14f' },
      { token: 'number', foreground: '#986801' },
      { token: 'comment', foreground: '#a0a1a7', fontStyle: 'italic' },
      { token: 'type', foreground: '#c18401' },
      { token: 'identifier', foreground: '#4078f2' },
      { token: 'operator', foreground: '#0184bc' },
      { token: 'delimiter', foreground: '#383a42' },
    ],
  },
  'verql-midnight': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#0a0a12',
      'editor.foreground': '#e0e0f0',
      'editor.lineHighlightBackground': '#ffffff0a',
      'editor.selectionBackground': '#8b7cf840',
      'editorLineNumber.foreground': '#555578',
      'editorCursor.foreground': '#8b7cf8',
      'editor.selectionHighlightBackground': '#8b7cf820',
      'editorBracketMatch.background': '#8b7cf830',
      'editorBracketMatch.border': '#8b7cf850',
    },
    rules: [
      { token: 'keyword', foreground: '#c678dd' },
      { token: 'string', foreground: '#98c379' },
      { token: 'number', foreground: '#d19a66' },
      { token: 'comment', foreground: '#555578', fontStyle: 'italic' },
      { token: 'type', foreground: '#e5c07b' },
      { token: 'identifier', foreground: '#61afef' },
      { token: 'operator', foreground: '#56b6c2' },
      { token: 'delimiter', foreground: '#a0a0c0' },
    ],
  },
  'verql-dracula': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#ffffff0a',
      'editor.selectionBackground': '#bd93f940',
      'editorLineNumber.foreground': '#6272a4',
      'editorCursor.foreground': '#f8f8f2',
      'editor.selectionHighlightBackground': '#bd93f920',
      'editorBracketMatch.background': '#bd93f930',
      'editorBracketMatch.border': '#bd93f950',
    },
    rules: [
      { token: 'keyword', foreground: '#ff79c6' },
      { token: 'string', foreground: '#f1fa8c' },
      { token: 'number', foreground: '#bd93f9' },
      { token: 'comment', foreground: '#6272a4', fontStyle: 'italic' },
      { token: 'type', foreground: '#8be9fd', fontStyle: 'italic' },
      { token: 'identifier', foreground: '#50fa7b' },
      { token: 'operator', foreground: '#ff79c6' },
      { token: 'delimiter', foreground: '#f8f8f2' },
    ],
  },
  'verql-nord': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#2e3440',
      'editor.foreground': '#d8dee9',
      'editor.lineHighlightBackground': '#ffffff08',
      'editor.selectionBackground': '#88c0d040',
      'editorLineNumber.foreground': '#4c566a',
      'editorCursor.foreground': '#d8dee9',
      'editor.selectionHighlightBackground': '#88c0d020',
      'editorBracketMatch.background': '#88c0d030',
      'editorBracketMatch.border': '#88c0d050',
    },
    rules: [
      { token: 'keyword', foreground: '#81a1c1' },
      { token: 'string', foreground: '#a3be8c' },
      { token: 'number', foreground: '#b48ead' },
      { token: 'comment', foreground: '#4c566a', fontStyle: 'italic' },
      { token: 'type', foreground: '#8fbcbb' },
      { token: 'identifier', foreground: '#88c0d0' },
      { token: 'operator', foreground: '#81a1c1' },
      { token: 'delimiter', foreground: '#eceff4' },
    ],
  },
  'verql-solarized': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#002b36',
      'editor.foreground': '#839496',
      'editor.lineHighlightBackground': '#ffffff08',
      'editor.selectionBackground': '#268bd240',
      'editorLineNumber.foreground': '#586e75',
      'editorCursor.foreground': '#839496',
      'editor.selectionHighlightBackground': '#268bd220',
      'editorBracketMatch.background': '#268bd230',
      'editorBracketMatch.border': '#268bd250',
    },
    rules: [
      { token: 'keyword', foreground: '#859900' },
      { token: 'string', foreground: '#2aa198' },
      { token: 'number', foreground: '#d33682' },
      { token: 'comment', foreground: '#586e75', fontStyle: 'italic' },
      { token: 'type', foreground: '#b58900' },
      { token: 'identifier', foreground: '#268bd2' },
      { token: 'operator', foreground: '#859900' },
      { token: 'delimiter', foreground: '#93a1a1' },
    ],
  },
  'verql-catppuccin': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#1e1e2e',
      'editor.foreground': '#cdd6f4',
      'editor.lineHighlightBackground': '#ffffff08',
      'editor.selectionBackground': '#cba6f740',
      'editorLineNumber.foreground': '#585b70',
      'editorCursor.foreground': '#f5e0dc',
      'editor.selectionHighlightBackground': '#cba6f720',
      'editorBracketMatch.background': '#cba6f730',
      'editorBracketMatch.border': '#cba6f750',
    },
    rules: [
      { token: 'keyword', foreground: '#cba6f7' },
      { token: 'string', foreground: '#a6e3a1' },
      { token: 'number', foreground: '#fab387' },
      { token: 'comment', foreground: '#585b70', fontStyle: 'italic' },
      { token: 'type', foreground: '#f9e2af' },
      { token: 'identifier', foreground: '#89b4fa' },
      { token: 'operator', foreground: '#89dceb' },
      { token: 'delimiter', foreground: '#bac2de' },
    ],
  },
}

const APP_TO_MONACO: Record<string, string> = {
  nightshift: 'verql-nightshift',
  lab: 'verql-lab',
  inkpaper: 'verql-inkpaper',
  dark: 'verql-dark',
  light: 'verql-light',
  midnight: 'verql-midnight',
  dracula: 'verql-dracula',
  nord: 'verql-nord',
  solarized: 'verql-solarized',
  catppuccin: 'verql-catppuccin',
}

let defined = false

export function defineAppThemes(monaco: Monaco): void {
  if (defined) return
  for (const [name, def] of Object.entries(themes)) {
    monaco.editor.defineTheme(name, {
      base: def.base,
      inherit: true,
      colors: def.colors,
      rules: def.rules,
    })
  }
  defined = true
}

export function getMonacoThemeName(appTheme: string): string {
  return APP_TO_MONACO[appTheme] ?? 'verql-nightshift'
}
