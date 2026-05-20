import { useCallback, useEffect, useMemo, useState } from 'react'
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

export function QueryEditor({ value, onChange, onExecute, connectionId, schema, databaseType }: Props) {
  // Tracked in state (not refs) so the keybindings effect re-runs once Monaco
  // is ready, instead of silently missing the initial registration.
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null)
  const [monacoInstance, setMonacoInstance] = useState<Monaco | null>(null)
  const { connectedIds } = useConnectionsStore()
  const { theme } = useTheme()
  const editorSettings = useSettingsStore((s) => s.settings.editor)
  const keybindings = useSettingsStore((s) => s.settings.keybindings)

  const language = databaseType === 'mongodb' ? 'json' : databaseType === 'redis' ? 'plaintext' : 'sql'

  const handleMount: OnMount = useCallback((ed, monaco) => {
    setEditorInstance(ed)
    setMonacoInstance(monaco)

    defineAppThemes(monaco)

    if (!registeredLanguages.has(language)) {
      registerCompletionProvider(monaco, language)
      if (language === 'sql') {
        registerAIInlineCompletionProvider(monaco, language)
      }
      registeredLanguages.add(language)
    }

    ed.focus()
  }, [language])

  // Register editor actions (keybindings) live. Re-runs whenever the user
  // rebinds an action in Settings or when the editor itself remounts, with
  // proper disposal so duplicate accelerators don't pile up.
  useEffect(() => {
    if (!editorInstance || !monacoInstance) return

    const actions: { id: string; label: string; bindingId: string; run: () => void }[] = [
      { id: 'execute-query', label: 'Execute Query', bindingId: 'execute-query', run: () => onExecute() },
    ]

    const disposables = actions.map((a) => {
      const binding = keybindings.find((k) => k.id === a.bindingId)
      const keys = binding
        ? binding.keys.map((k) => parseKeybinding(k, monacoInstance)).filter((c) => c > 0)
        : [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter]
      return editorInstance.addAction({ id: a.id, label: a.label, keybindings: keys, run: a.run })
    })

    return () => { for (const d of disposables) d.dispose() }
  }, [editorInstance, monacoInstance, keybindings, onExecute])

  useEffect(() => {
    setAICompletionContext(connectionId && connectedIds.has(connectionId) ? connectionId : null)
  }, [connectionId, connectedIds])

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
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  }), [editorSettings])

  return (
    <Editor
      language={language}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      theme={getMonacoThemeName(theme)}
      options={options}
      onMount={handleMount}
      loading={
        <Flex align="center" justify="center" className="h-full">
          <Text size="sm" color="muted">Loading editor...</Text>
        </Flex>
      }
    />
  )
}
