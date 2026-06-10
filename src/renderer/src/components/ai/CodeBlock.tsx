import { useCallback } from 'react'
import { CodeBlock as CynosureCodeBlock } from '@arshad-shah/cynosure-react/code-block'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { useTranslation } from '@/i18n/I18nProvider'

interface CodeBlockProps {
  code: string
  language?: string
  showInsert?: boolean
  // alwaysShowInsert is retained for call-site compatibility; CodeView always
  // shows header actions, so the old hover-reveal behavior no longer applies.
  alwaysShowInsert?: boolean
}

export function CodeBlock({ code, language, showInsert = true }: CodeBlockProps) {
  const { t } = useTranslation()
  const updateTabSql = useTabsStore(s => s.updateTabSql)
  const addQueryTab = useTabsStore(s => s.addQueryTab)
  const tabs = useTabsStore(s => s.tabs)
  const activeTabId = useTabsStore(s => s.activeTabId)
  const connectionId = useConnectionsStore(s => s.activeConnectionId)

  const insertIntoEditor = useCallback(() => {
    const activeTab = tabs.find(tab => tab.id === activeTabId && tab.type === 'query')
    if (activeTab) {
      updateTabSql(activeTab.id, code)
    } else {
      const newId = addQueryTab(connectionId)
      updateTabSql(newId, code)
    }
  }, [code, tabs, activeTabId, connectionId, updateTabSql, addQueryTab])

  return (
    <CynosureCodeBlock
      language={language ?? 'text'}
      copyable
      // The header's filename slot doubles as the action rail: keep the
      // language label and add the Insert affordance beside it.
      filename={
        <span className="flex items-center gap-2">
          {language}
          {showInsert && (
            <button
              type="button"
              onClick={insertIntoEditor}
              className="px-1.5 py-0.5 rounded text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-hover)]"
            >
              {t('aiui.chat.insert')}
            </button>
          )}
        </span>
      }
    >
      {code}
    </CynosureCodeBlock>
  )
}
