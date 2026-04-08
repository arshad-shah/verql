import { useRef, useCallback, useEffect } from 'react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { registerSqlCompletionProvider, updateTableNames } from '@/lib/monaco-sql'
import { useConnectionsStore } from '@/stores/connections'
import { Flex, Text } from '@/primitives'

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

  const language = databaseType === 'mongodb' ? 'json' : databaseType === 'redis' ? 'plaintext' : 'sql'

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor

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
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        padding: { top: 8, bottom: 8 },
        renderLineHighlight: 'line',
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8
        }
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
