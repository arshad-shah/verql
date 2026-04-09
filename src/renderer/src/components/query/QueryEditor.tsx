import { useRef, useCallback, useEffect } from 'react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { registerSqlCompletionProvider, updateTableNames } from '@/lib/monaco-sql'
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

let completionRegistered = false

export function QueryEditor({ value, onChange, onExecute, connectionId, schema, databaseType }: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const { connectedIds } = useConnectionsStore()
  const { theme } = useTheme()
  const editorSettings = useSettingsStore((s) => s.settings.editor)

  const language = databaseType === 'mongodb' ? 'json' : databaseType === 'redis' ? 'plaintext' : 'sql'

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor

    defineAppThemes(monaco)

    if (!completionRegistered && language === 'sql') {
      registerSqlCompletionProvider(monaco)
      completionRegistered = true
    }

    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => onExecute()
    })

    editor.focus()
  }, [onExecute, language])

  useEffect(() => {
    if (!connectionId || !connectedIds.has(connectionId) || language !== 'sql') {
      updateTableNames([])
      return
    }
    window.electronAPI.invoke('db:get-table-names', connectionId, schema ?? undefined)
      .then(names => updateTableNames(names))
      .catch(() => updateTableNames([]))
  }, [connectionId, schema, connectedIds, language])

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
