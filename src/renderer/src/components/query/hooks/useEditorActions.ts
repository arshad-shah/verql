import { useEffect } from 'react'
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type { KeyBinding } from '@shared/settings'
import { KEYBINDING_ACTION } from '@shared/settings'
import { parseKeybinding } from '@/lib/monaco-keybindings'
import { useTranslation } from '@/i18n/I18nProvider'

interface Options {
  editorInstance: editor.IStandaloneCodeEditor | null
  monacoInstance: Monaco | null
  keybindings: KeyBinding[]
  language: string
  onExecute: () => void
  onSave?: () => void
}

/** Registers the editor's keybinding-driven actions (execute / save / AI
 *  inline trigger) live, re-running whenever the user rebinds in Settings or
 *  the editor remounts, with disposal so duplicate accelerators don't pile up.
 *  Each action prefers the user's bound keys and falls back to the default. */
export function useEditorActions({ editorInstance, monacoInstance, keybindings, language, onExecute, onSave }: Options): void {
  const { t } = useTranslation()

  useEffect(() => {
    if (!editorInstance || !monacoInstance) return

    const actions: { id: string; label: string; bindingId: string; fallback: number; run: () => void }[] = [
      {
        id: KEYBINDING_ACTION.EXECUTE_QUERY, label: t('query.editor.executeAction'), bindingId: KEYBINDING_ACTION.EXECUTE_QUERY,
        fallback: monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
        run: () => onExecute()
      },
    ]
    if (onSave) {
      actions.push({
        id: KEYBINDING_ACTION.SAVE_QUERY, label: t('query.editor.saveAction'), bindingId: KEYBINDING_ACTION.SAVE_QUERY,
        fallback: monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
        run: () => onSave()
      })
    }
    if (language === 'sql') {
      actions.push({
        id: KEYBINDING_ACTION.AI_INLINE_TRIGGER,
        label: t('query.editor.aiTriggerAction'),
        bindingId: KEYBINDING_ACTION.AI_INLINE_TRIGGER,
        fallback: monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Backslash,
        run: () => editorInstance.trigger('verql', 'editor.action.inlineSuggest.trigger', null),
      })
    }

    const disposables = actions.map((a) => {
      const binding = keybindings.find((k) => k.id === a.bindingId)
      const keys = binding
        ? binding.keys.map((k) => parseKeybinding(k, monacoInstance)).filter((c) => c > 0)
        : [a.fallback]
      return editorInstance.addAction({ id: a.id, label: a.label, keybindings: keys, run: a.run })
    })

    return () => { for (const d of disposables) d.dispose() }
  }, [editorInstance, monacoInstance, keybindings, onExecute, onSave, language, t])
}
