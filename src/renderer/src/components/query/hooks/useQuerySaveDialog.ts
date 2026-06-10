import { useCallback, useRef, useState } from 'react'
import { saveQuery } from '@/components/saved-queries/SavedQueriesPanel'
import { useTabsStore } from '@/stores/tabs'
import { toast } from '@arshad-shah/cynosure-react/toast'
import type { QueryTab, DatabaseType } from '@shared/types'
import { useTranslation } from '@/i18n/I18nProvider'

export interface QuerySaveDialog {
  handleSave: () => void
  saveDialogOpen: boolean
  setSaveDialogOpen: (open: boolean) => void
  saveDialogName: string
  setSaveDialogName: (name: string) => void
  confirmSaveDialog: () => void
}

/** Owns the "save query" flow for a tab: silent re-save of an already-saved
 *  query, and the first-time in-app name prompt (window.prompt is unsupported
 *  in Electron's renderer). */
export function useQuerySaveDialog(tab: QueryTab, dbType: DatabaseType | undefined): QuerySaveDialog {
  const { t } = useTranslation()
  const markTabSaved = useTabsStore(s => s.markTabSaved)

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveDialogName, setSaveDialogName] = useState('')
  const pendingSqlRef = useRef<string>('')

  const handleSave = useCallback(() => {
    // Read the latest tab state directly — closures captured by event listeners
    // would otherwise see stale `tab.savedQueryId`/`tab.sql` and re-prompt or
    // save the wrong content if the user typed quickly between renders.
    const current = useTabsStore.getState().tabs.find(t => t.id === tab.id)
    if (!current || current.type !== 'query') return
    const sql = current.sql.trim()
    if (!sql) {
      toast.info(t('query.save.nothingToSaveTitle'), { description: t('query.save.nothingToSaveMessage') })
      return
    }
    if (current.savedQueryId) {
      saveQuery({ id: current.savedQueryId, name: current.title, sql, connectionType: dbType })
      markTabSaved(current.id)
      toast.success(t('query.save.savedTitle'), { description: current.title })
      return
    }
    // First-time save: open the in-app prompt (window.prompt is unsupported in
    // Electron's renderer and throws).
    pendingSqlRef.current = sql
    setSaveDialogName(current.title?.trim() || t('query.save.defaultName', { timestamp: new Date().toLocaleString() }))
    setSaveDialogOpen(true)
  }, [tab.id, dbType, markTabSaved, t])

  const confirmSaveDialog = useCallback(() => {
    const name = saveDialogName.trim()
    const sql = pendingSqlRef.current
    if (!name || !sql) {
      setSaveDialogOpen(false)
      return
    }
    const id = saveQuery({ name, sql, connectionType: dbType })
    markTabSaved(tab.id, { title: name, savedQueryId: id })
    toast.success(t('query.save.savedQueryTitle'), { description: name })
    setSaveDialogOpen(false)
  }, [saveDialogName, dbType, markTabSaved, tab.id, t])

  return { handleSave, saveDialogOpen, setSaveDialogOpen, saveDialogName, setSaveDialogName, confirmSaveDialog }
}
