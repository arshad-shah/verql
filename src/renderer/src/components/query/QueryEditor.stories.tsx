import type { Meta, StoryObj } from '@storybook/react'
import { useRef, useCallback, useState, useEffect } from 'react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { defineAppThemes, getMonacoThemeName } from '@/lib/monaco-themes'

const meta: Meta = {
  title: 'Components/QueryEditor',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}
export default meta

const SAMPLE_SQL = `-- Sample query: find active users with recent orders
SELECT
  u.id,
  u.name,
  u.email,
  COUNT(o.id) AS order_count,
  MAX(o.created_at) AS last_order
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.active = true
  AND u.created_at >= '2026-01-01'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 0
ORDER BY order_count DESC
LIMIT 50;`

const SAMPLE_JSON = `{
  "find": "users",
  "filter": { "active": true },
  "projection": { "name": 1, "email": 1 },
  "sort": { "created_at": -1 },
  "limit": 50
}`

export const Default: StoryObj = {
  render: function Render() {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const [language, setLanguage] = useState<'sql' | 'json' | 'plaintext'>('sql')
    const onExecute = () => console.log('Query executed')

    const [theme, setTheme] = useState(
      document.documentElement.getAttribute('data-theme') ?? 'dark'
    )

    useEffect(() => {
      const observer = new MutationObserver(() => {
        const t = document.documentElement.getAttribute('data-theme') ?? 'dark'
        setTheme(t)
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
      return () => observer.disconnect()
    }, [])

    const handleMount: OnMount = useCallback((editor, monaco) => {
      editorRef.current = editor
      defineAppThemes(monaco)
      monaco.editor.setTheme(getMonacoThemeName(theme))

      editor.addAction({
        id: 'execute-query',
        label: 'Execute Query',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => onExecute(),
      })

      editor.focus()
    }, [onExecute, theme])

    useEffect(() => {
      if (editorRef.current) {
        const monaco = (window as any).monaco
        if (monaco) monaco.editor.setTheme(getMonacoThemeName(theme))
      }
    }, [theme])

    const content = language === 'json' ? SAMPLE_JSON : language === 'plaintext' ? 'PING' : SAMPLE_SQL

    return (
      <div className="flex flex-col h-[500px] bg-bg-primary">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border-default bg-bg-secondary">
          <span className="text-xs text-text-muted">Language:</span>
          {(['sql', 'json', 'plaintext'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                language === lang
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-hover'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
          <span className="flex-1" />
          <span className="text-[10px] text-text-muted">⌘+Enter to execute</span>
        </div>
        <div className="flex-1">
          <Editor
            language={language}
            value={content}
            theme={getMonacoThemeName(theme)}
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
              scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            }}
            onMount={handleMount}
          />
        </div>
      </div>
    )
  },
}
