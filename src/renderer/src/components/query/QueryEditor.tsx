import { useRef, useCallback, useEffect } from 'react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { registerCompletionProvider, updateCompletionItems } from '@/lib/monaco-sql'
import { registerAIInlineCompletionProvider, setAICompletionContext } from '@/lib/monaco-ai-completion'
import { defineAppThemes, getMonacoThemeName } from '@/lib/monaco-themes'
import { useConnectionsStore } from '@/stores/connections'
import { useSettingsStore } from '@/stores/settings'
import { Flex, Text, useTheme } from '@/primitives'

interface Props {
  value: string
  onChange: (value: string) => void
  onExecute: () => void
  connectionId: string | null
  schema: string | null
  databaseType?: string
}

const registeredLanguages = new Set<string>()

function parseKeybinding(key: string, monaco: Monaco): number {
  const parts = key.split('+')
  let result = 0
  for (const part of parts) {
    const p = part.trim().toLowerCase()
    if (p === 'ctrl') result |= monaco.KeyMod.CtrlCmd
    else if (p === 'cmd') result |= monaco.KeyMod.CtrlCmd
    else if (p === 'shift') result |= monaco.KeyMod.Shift
    else if (p === 'alt') result |= monaco.KeyMod.Alt
    else if (p === 'enter') result |= monaco.KeyCode.Enter
    else if (p === 's') result |= monaco.KeyCode.KeyS
    else if (p.length === 1) {
      const code = (monaco.KeyCode as Record<string, number>)[`Key${p.toUpperCase()}`]
      if (code) result |= code
    }
  }
  return result
}

export function QueryEditor({ value, onChange, onExecute, connectionId, schema, databaseType }: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const { connectedIds } = useConnectionsStore()
  const { theme } = useTheme()
  const editorSettings = useSettingsStore((s) => s.settings.editor)
  const keybindings = useSettingsStore((s) => s.settings.keybindings)

  const language = databaseType === 'mongodb' ? 'json' : databaseType === 'redis' ? 'plaintext' : 'sql'

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    defineAppThemes(monaco)

    // Register completion provider per language (once per language)
    if (!registeredLanguages.has(language)) {
      registerCompletionProvider(monaco, language)
      if (language === 'sql') {
        registerAIInlineCompletionProvider(monaco, language)
      }
      registeredLanguages.add(language)
    }

    const executeBinding = keybindings.find(k => k.id === 'execute-query')
    const executeKeys = executeBinding
      ? executeBinding.keys.map(k => parseKeybinding(k, monaco)).filter(Boolean)
      : [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter]

    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: executeKeys,
      run: () => onExecute()
    })

    editor.focus()
  }, [onExecute, language, keybindings])

  // Update AI completion context
  useEffect(() => {
    setAICompletionContext(connectionId && connectedIds.has(connectionId) ? connectionId : null)
  }, [connectionId, connectedIds])

  // Fetch completions from plugin when connection/schema/databaseType changes
  useEffect(() => {
    if (!connectionId || !connectedIds.has(connectionId) || !databaseType) {
      updateCompletionItems([])
      return
    }
    window.electronAPI.invoke('plugins:completions', databaseType, connectionId, {
      connectionId,
      schema: schema ?? undefined
    })
      .then(items => updateCompletionItems(items))
      .catch(() => updateCompletionItems([]))
  }, [connectionId, schema, connectedIds, databaseType])

  return (
    <Editor
      language={language}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      theme={getMonacoThemeName(theme)}
      options={{
        minimap: { enabled: editorSettings.minimap },
        fontSize: editorSettings.fontSize,
        fontFamily: editorSettings.fontFamily,
        lineNumbers: editorSettings.lineNumbers ? 'on' : 'off',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: editorSettings.tabSize,
        wordWrap: editorSettings.wordWrap ? 'on' : 'off',
        cursorStyle: editorSettings.cursorStyle,
        fontLigatures: editorSettings.ligatures,
        matchBrackets: editorSettings.bracketMatching ? 'always' : 'never',
        padding: { top: 8, bottom: 8 },
        renderLineHighlight: 'line',
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
      }}
      onMount={handleMount}
      loading={
        <Flex align="center" justify="center" className="h-full">
          <Text size="sm" color="muted">Loading editor...</Text>
        </Flex>
      }
    />
  )
}
