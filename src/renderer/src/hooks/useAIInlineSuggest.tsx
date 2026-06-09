import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import type { editor } from 'monaco-editor'
import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import { IconButton } from '@arshad-shah/cynosure-react/icon-button'
import { Kbd } from '@arshad-shah/cynosure-react/kbd'
import { useAIStore } from '@/stores/ai'
import {
  subscribeInlineAIState,
  getInlineAIState,
  type InlineAIState,
} from '@/lib/monaco-ai-completion'

/**
 * Mounts two Monaco overlay widgets:
 *   1. A status pill (top-right of the editor viewport) reflecting the
 *      inline-completion state machine: idle → thinking → ready → idle.
 *   2. A compact Accept/Reject toolbar anchored to the cursor line whenever
 *      the provider has a suggestion ready. Icon-only with kbd hints — the
 *      keyboard shortcuts (Tab / Esc) do the same work; the toolbar is
 *      discoverability + click affordance, not the primary path.
 *
 * Both widgets render React content into DOM nodes owned by Monaco; the
 * hook tears them down on unmount.
 */
export function useAIInlineSuggest(ed: editor.IStandaloneCodeEditor | null): void {
  useEffect(() => {
    if (!ed) return

    const pillNode = document.createElement('div')
    const toolbarNode = document.createElement('div')
    const pillRoot = createRoot(pillNode)
    const toolbarRoot = createRoot(toolbarNode)

    // 0 = TOP_RIGHT_CORNER (keeps the pill above any UI Verql renders below
    // the editor: results pane, action zone, status bar).
    const pillWidget: editor.IOverlayWidget = {
      getId: () => 'verql.inline-ai.pill',
      getDomNode: () => pillNode,
      getPosition: () => ({ preference: 0 }),
    }
    const toolbarWidget: editor.IContentWidget = {
      getId: () => 'verql.inline-ai.toolbar',
      getDomNode: () => toolbarNode,
      getPosition: () => {
        const pos = ed.getPosition()
        if (!pos) return null
        return { position: pos, preference: [2, 1] }
      },
    }

    ed.addOverlayWidget(pillWidget)
    ed.addContentWidget(toolbarWidget)

    const render = (state: InlineAIState): void => {
      const modelId = useAIStore.getState().activeModel
      const model = useAIStore.getState().models.find((m) => m.id === modelId)?.name ?? modelId ?? 'AI'
      pillRoot.render(<Pill state={state} model={model} />)
      toolbarRoot.render(state === 'ready' ? <Toolbar editor={ed} /> : null)
      ed.layoutContentWidget(toolbarWidget)
    }

    render(getInlineAIState())
    const unsub = subscribeInlineAIState(render)
    const cursorSub = ed.onDidChangeCursorPosition(() => ed.layoutContentWidget(toolbarWidget))

    return () => {
      unsub()
      cursorSub.dispose()
      ed.removeOverlayWidget(pillWidget)
      ed.removeContentWidget(toolbarWidget)
      pillRoot.unmount()
      toolbarRoot.unmount()
    }
  }, [ed])
}

function Pill({ state, model }: { state: InlineAIState; model: string }) {
  if (state === 'idle') return null
  const thinking = state === 'thinking'
  return (
    <div
      className={`verql-ai-pill m-2 inline-flex items-center gap-2 rounded-full border bg-bg-elevated px-2.5 py-1 text-[11px] shadow-md transition-all duration-200 ${
        thinking
          ? 'border-accent text-accent'
          : 'border-success text-success'
      }`}
      style={{ animation: 'verql-ai-pill-in 180ms ease-out' }}
    >
      {thinking
        ? <Loader2 size={11} className="animate-spin" />
        : <Sparkles size={11} />}
      <span className="font-medium">{model}</span>
      <span className="text-text-muted">·</span>
      <Kbd size="sm">{thinking ? 'Esc' : 'Tab'}</Kbd>
      <style>{`
        @keyframes verql-ai-pill-in {
          from { opacity: 0; transform: translateY(-4px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  )
}

function Toolbar({ editor: ed }: { editor: editor.IStandaloneCodeEditor }) {
  return (
    <div
      className="mt-1 inline-flex items-center gap-1 rounded-md border border-border-default bg-bg-elevated px-1 py-0.5 shadow-[var(--shadow-dropdown)]"
      style={{ animation: 'verql-ai-toolbar-in 140ms ease-out' }}
    >
      <IconButton
        label="Accept suggestion"
        icon={<Check size={12} />}
        variant="ghost"
        colorScheme="success"
        size="xs"
        className="!h-6 !w-6"
        onClick={() => ed.trigger('verql', 'editor.action.inlineSuggest.commit', null)}
      />
      <Kbd size="sm">Tab</Kbd>
      <span className="mx-0.5 h-3 w-px bg-border-default" />
      <IconButton
        label="Reject suggestion"
        icon={<X size={12} />}
        variant="ghost"
        colorScheme="danger"
        size="xs"
        className="!h-6 !w-6"
        onClick={() => ed.trigger('verql', 'editor.action.inlineSuggest.hide', null)}
      />
      <Kbd size="sm">Esc</Kbd>
      <style>{`
        @keyframes verql-ai-toolbar-in {
          from { opacity: 0; transform: translateY(-2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
