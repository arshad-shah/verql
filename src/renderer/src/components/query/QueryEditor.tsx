import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAIInlineSuggest } from '@/hooks/useAIInlineSuggest'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { registerCompletionProvider, registerQueryFormattingProvider, updateCompletionItems } from '@/lib/monaco-sql'
import { registerAIInlineCompletionProvider, setAICompletionContext } from '@/lib/monaco-ai-completion'
import { defineAppThemes, getMonacoThemeName } from '@/lib/monaco-themes'
import { StatementGutter } from './StatementGutter'
import { editorRegistry } from '@/stores/editor'
import { useConnectionsStore } from '@/stores/connections'
import { useSettingsStore } from '@/stores/settings'
import { useDriverCapabilitiesStore } from '@/stores/driver-capabilities'
import { Flex, Text, useTheme } from '@/primitives'
import { IPC_CHANNELS } from '@shared/ipc'
import { KEYBINDING_ACTION } from '@shared/settings'
import { useTranslation } from '@/i18n/I18nProvider'

interface Props {
  tabId: string
  value: string
  onChange: (value: string) => void
  onExecute: () => void
  onSave?: () => void
  connectionId: string | null
  schema: string | null
  databaseType?: string
}

const registeredLanguages = new Set<string>()

/**
 * Parse a "Ctrl+Shift+P" / "Cmd+Enter" style binding into a Monaco keybinding
 * bitmask. Returns 0 if any part of the binding is unrecognised so the caller
 * can drop it instead of producing a broken accelerator.
 */
function parseKeybinding(key: string, monaco: Monaco): number {
  const parts = key.split('+').map((p) => p.trim().toLowerCase())
  let mods = 0
  let keyCode = 0
  const KC = monaco.KeyCode as unknown as Record<string, number>

  for (const part of parts) {
    if (part === 'ctrl' || part === 'cmd' || part === 'meta') { mods |= monaco.KeyMod.CtrlCmd; continue }
    if (part === 'shift') { mods |= monaco.KeyMod.Shift; continue }
    if (part === 'alt' || part === 'option') { mods |= monaco.KeyMod.Alt; continue }
    if (part === 'winctrl') { mods |= monaco.KeyMod.WinCtrl; continue }

    // The key portion. Drop the binding if we can't resolve it cleanly.
    let code = 0
    if (part.length === 1 && /[a-z]/.test(part)) code = KC[`Key${part.toUpperCase()}`]
    else if (part.length === 1 && /[0-9]/.test(part)) code = KC[`Digit${part}`]
    else if (/^f([1-9]|1[0-9]|2[0-4])$/.test(part)) code = KC[`F${part.slice(1)}`]
    else {
      const named: Record<string, string> = {
        enter: 'Enter', tab: 'Tab', escape: 'Escape', esc: 'Escape',
        space: 'Space', backspace: 'Backspace', delete: 'Delete',
        home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown',
        up: 'UpArrow', down: 'DownArrow', left: 'LeftArrow', right: 'RightArrow',
        ',': 'Comma', '.': 'Period', '/': 'Slash', '\\': 'Backslash',
        ';': 'Semicolon', "'": 'Quote', '[': 'BracketLeft', ']': 'BracketRight',
        '-': 'Minus', '=': 'Equal', '`': 'Backquote'
      }
      const mapped = named[part]
      if (mapped) code = KC[mapped]
    }
    if (!code) return 0
    keyCode = code
  }
  return keyCode ? mods | keyCode : 0
}

export function QueryEditor({ tabId, value, onChange, onExecute, onSave, connectionId, schema, databaseType }: Props) {
  const { t } = useTranslation()
  // Tracked in state (not refs) so the keybindings effect re-runs once Monaco
  // is ready, instead of silently missing the initial registration.
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null)
  const [monacoInstance, setMonacoInstance] = useState<Monaco | null>(null)
  const { connectedIds } = useConnectionsStore()
  const { theme } = useTheme()
  const editorSettings = useSettingsStore((s) => s.settings.editor)
  const keybindings = useSettingsStore((s) => s.settings.keybindings)

  // The Monaco language is contributed by the driver plugin (`editorLanguage`
  // in its DriverFactory). The renderer doesn't branch on db type.
  const cachedCaps = useDriverCapabilitiesStore((s) => databaseType ? s.byType[databaseType] : undefined)
  const fetchCaps = useDriverCapabilitiesStore((s) => s.fetch)
  useEffect(() => {
    if (databaseType && cachedCaps === undefined) {
      fetchCaps(databaseType).catch(() => {})
    }
  }, [databaseType, cachedCaps, fetchCaps])
  const language = cachedCaps?.editorLanguage ?? 'sql'

  // Define themes BEFORE the editor mounts. Monaco's <Editor> applies its
  // `theme` prop synchronously during construction; if the named theme
  // ("verql-dark" etc.) hasn't been defined yet, Monaco silently falls back
  // to its built-in "vs" (light). Using `beforeMount` rather than `onMount`
  // means the first paint already shows the correct colours — no light flash.
  const handleBeforeMount = useCallback((monaco: Monaco) => {
    defineAppThemes(monaco)
  }, [])

  const handleMount: OnMount = useCallback((ed, monaco) => {
    setEditorInstance(ed)
    setMonacoInstance(monaco)

    // Idempotent — defineAppThemes guards itself. Belt and suspenders in case
    // a host wires this editor without going through beforeMount.
    defineAppThemes(monaco)

    if (!registeredLanguages.has(language)) {
      registerCompletionProvider(monaco, language)
      // Formatting is language-agnostic: the provider resolves a plugin-owned
      // formatter for the model's language + connection, and no-ops when none.
      registerQueryFormattingProvider(monaco, language)
      if (language === 'sql') {
        registerAIInlineCompletionProvider(monaco, language)
      }
      registeredLanguages.add(language)
    }

    // Publish ourselves to the editor registry so the command palette,
    // run-selection action, and any plugin can introspect or drive the editor.
    editorRegistry.register({ editor: ed, monaco, tabId })

    ed.focus()
  }, [language, tabId])

  // Keep the registry pointed at *this* editor while the tab is mounted, and
  // tear it down on unmount so the palette doesn't reference a dead instance.
  useEffect(() => {
    return () => editorRegistry.unregister(tabId)
  }, [tabId])

  // Register editor actions (keybindings) live. Re-runs whenever the user
  // rebinds an action in Settings or when the editor itself remounts, with
  // proper disposal so duplicate accelerators don't pile up.
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
  }, [editorInstance, monacoInstance, keybindings, onExecute, onSave, language])

  useAIInlineSuggest(language === 'sql' ? editorInstance : null)

  useEffect(() => {
    setAICompletionContext(connectionId && connectedIds.has(connectionId) ? connectionId : null)
  }, [connectionId, connectedIds])

  useEffect(() => {
    if (!connectionId || !connectedIds.has(connectionId) || !databaseType) {
      updateCompletionItems([])
      return
    }
    window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_COMPLETIONS, databaseType, connectionId, {
      connectionId,
      schema: schema ?? undefined
    })
      .then(items => updateCompletionItems(items))
      .catch(() => updateCompletionItems([]))
  }, [connectionId, schema, connectedIds, databaseType])

  // Memoising prevents the editor wrapper from re-running its deep-diff on
  // every parent render; it still re-applies whenever any setting changes.
  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(() => ({
    minimap: { enabled: editorSettings.minimap },
    fontSize: editorSettings.fontSize,
    fontFamily: editorSettings.fontFamily,
    fontLigatures: editorSettings.ligatures,
    lineNumbers: editorSettings.lineNumbers ? 'on' : 'off',
    scrollBeyondLastLine: editorSettings.scrollPastEnd,
    automaticLayout: true,
    tabSize: editorSettings.tabSize,
    wordWrap: editorSettings.wordWrap ? 'on' : 'off',
    cursorStyle: editorSettings.cursorStyle,
    cursorSmoothCaretAnimation: editorSettings.smoothCursor ? 'on' : 'off',
    autoClosingBrackets: editorSettings.autoClosingBrackets ? 'languageDefined' : 'never',
    autoClosingQuotes: editorSettings.autoClosingBrackets ? 'languageDefined' : 'never',
    matchBrackets: editorSettings.bracketMatching ? 'always' : 'never',
    renderLineHighlight: editorSettings.highlightActiveLine ? 'line' : 'none',
    padding: { top: 8, bottom: 8 },
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    // Hide Monaco's built-in inline-suggest toolbar (the "Accept | Reject"
    // chip Monaco floats next to ghost text). Verql renders its own with
    // design-system primitives in useAIInlineSuggest — having both stacked
    // shows two competing toolbars.
    inlineSuggest: { enabled: true, showToolbar: 'never' },
    // Explicit: SQL editors render "Run / Explain" statement-gutter overlay above each
    // statement. The default is true, but we set it so a user who customises
    // editor options later can't accidentally hide the inline run buttons.
    codeLens: false,
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  }), [editorSettings])

  // Force-apply option changes to the live editor.
  //
  // @monaco-editor/react diffs the `options` prop and pushes changes via
  // `updateOptions`, but its diff misses nested keys in some versions and
  // certain options (fontFamily, fontLigatures) need a re-layout to take
  // effect visually. Calling updateOptions ourselves on every change is
  // cheap (Monaco no-ops unchanged keys) and guarantees the editor reflects
  // the latest Settings → Editor selections immediately.
  useEffect(() => {
    if (!editorInstance) return
    editorInstance.updateOptions(options)
  }, [editorInstance, options])

  // Same story for theme — Monaco won't restyle existing tokens when the
  // `theme` prop changes mid-life unless we tell it to. `setTheme` is
  // global (affects every editor instance), which is what we want here:
  // when the user flips themes in Settings, every open query tab updates.
  useEffect(() => {
    if (!monacoInstance) return
    monacoInstance.editor.setTheme(getMonacoThemeName(theme))
  }, [monacoInstance, theme])

  return (
    <>
      <Editor
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        theme={getMonacoThemeName(theme)}
        options={options}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        loading={
          <Flex align="center" justify="center" className="h-full">
            <Text size="sm" color="muted">{t('query.editor.loading')}</Text>
          </Flex>
        }
      />
      {editorInstance ? (
        <StatementGutter
          editor={editorInstance}
          tabId={tabId}
          connectionId={connectionId}
          dbType={databaseType}
        />
      ) : null}
    </>
  )
}
