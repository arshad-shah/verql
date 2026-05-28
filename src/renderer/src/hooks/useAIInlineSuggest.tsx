import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import type { editor } from 'monaco-editor'
import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/primitives/forms/Button'
import { Kbd } from '@/primitives/typography/Kbd'
import { Text } from '@/primitives/typography/Text'
import { useAIStore } from '@/stores/ai'
import {
  subscribeInlineAIState,
  getInlineAIState,
  type InlineAIState,
} from '@/lib/monaco-ai-completion'

/**
 * Mounts two Monaco overlay widgets:
 *   1. A status pill (bottom-right of the editor viewport) reflecting the
 *      inline-completion state machine: idle → thinking → ready → idle.
 *   2. An Accept/Reject toolbar anchored to the cursor line whenever the
 *      provider has a suggestion ready.
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

    // 0 = TOP_RIGHT_CORNER, 1 = BOTTOM_RIGHT_CORNER, 2 = TOP_CENTER.
    // Top-right keeps the pill visible above any UI Verql renders below the
    // editor (results pane, action zone, etc.). Bottom-right gets clipped.
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
        // [2 BELOW, 1 ABOVE]
        return { position: pos, preference: [2, 1] }
      },
    }

    ed.addOverlayWidget(pillWidget)
    ed.addContentWidget(toolbarWidget)

    const render = (state: InlineAIState): void => {
      const model = useAIStore.getState().activeModel ?? 'AI'
      pillRoot.render(<Pill state={state} model={model} />)
      toolbarRoot.render(state === 'ready' ? <Toolbar editor={ed} model={model} /> : null)
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
  return (
    <div className="m-2 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
      {state === 'thinking' ? (
        <Loader2 size={10} className="animate-spin" />
      ) : (
        <Sparkles size={10} />
      )}
      <span>{model}</span>
      {state === 'thinking' ? <Kbd size="sm">Esc</Kbd> : <Kbd size="sm">Tab</Kbd>}
    </div>
  )
}

function Toolbar({
  editor: ed,
  model,
}: {
  editor: editor.IStandaloneCodeEditor
  model: string
}) {
  return (
    <div className="mt-1 inline-flex items-center gap-0.5 rounded border border-border-default bg-bg-secondary p-0.5 shadow-sm">
      <Button
        variant="ghost"
        size="xs"
        className="!h-6 !px-1.5 gap-1 !text-success"
        onClick={() => ed.trigger('verql', 'editor.action.inlineSuggest.commit', null)}
      >
        <Check size={11} /> Accept <Kbd size="sm">Tab</Kbd>
      </Button>
      <Button
        variant="ghost"
        size="xs"
        className="!h-6 !px-1.5 gap-1 !text-error"
        onClick={() => ed.trigger('verql', 'editor.action.inlineSuggest.hide', null)}
      >
        <X size={11} /> Reject <Kbd size="sm">Esc</Kbd>
      </Button>
      <Text as="span" size="xs" color="muted" className="px-1.5">
        {model}
      </Text>
    </div>
  )
}
