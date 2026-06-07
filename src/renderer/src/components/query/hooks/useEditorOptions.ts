import { useEffect, useMemo } from 'react'
import type { editor } from 'monaco-editor'
import type { AppSettings } from '@shared/settings'

type EditorSettings = AppSettings['editor']

/** Builds the Monaco construction options from the user's Editor settings and
 *  force-applies them to the live editor on change.
 *
 *  @monaco-editor/react diffs the `options` prop and pushes changes via
 *  `updateOptions`, but its diff misses nested keys in some versions and
 *  certain options (fontFamily, fontLigatures) need a re-layout to take effect
 *  visually. Calling updateOptions ourselves is cheap (Monaco no-ops unchanged
 *  keys) and guarantees the editor reflects the latest selections immediately. */
export function useEditorOptions(
  editorSettings: EditorSettings,
  editorInstance: editor.IStandaloneCodeEditor | null
): editor.IStandaloneEditorConstructionOptions {
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

  useEffect(() => {
    if (!editorInstance) return
    editorInstance.updateOptions(options)
  }, [editorInstance, options])

  return options
}
