import { useCallback } from 'react'
import { CodeView } from '@/primitives'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'

interface CodeBlockProps {
  code: string
  language?: string
  showInsert?: boolean
  // alwaysShowInsert is retained for call-site compatibility; CodeView always
  // shows header actions, so the old hover-reveal behavior no longer applies.
  alwaysShowInsert?: boolean
}

export function CodeBlock({ code, language, showInsert = true }: CodeBlockProps) {
  const updateTabSql = useTabsStore(s => s.updateTabSql)
  const addQueryTab = useTabsStore(s => s.addQueryTab)
  const tabs = useTabsStore(s => s.tabs)
  const activeTabId = useTabsStore(s => s.activeTabId)
  const connectionId = useConnectionsStore(s => s.activeConnectionId)

  const insertIntoEditor = useCallback(() => {
    const activeTab = tabs.find(t => t.id === activeTabId && t.type === 'query')
    if (activeTab) {
      updateTabSql(activeTab.id, code)
    } else {
      const newId = addQueryTab(connectionId)
      updateTabSql(newId, code)
    }
  }, [code, tabs, activeTabId, connectionId, updateTabSql, addQueryTab])

  return (
    <CodeView
      code={code}
      language={language}
      actions={showInsert ? (
        <button
          type="button"
          onClick={insertIntoEditor}
          className="px-1.5 py-0.5 rounded text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-hover)]"
        >
          Insert
        </button>
      ) : undefined}
    />
  )
}
