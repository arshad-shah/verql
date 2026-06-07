import { useState, useEffect } from 'react'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import DOMPurify from 'dompurify'
import { useClipboard } from '@/hooks/useClipboard'

const SUPPORTED_LANGS = ['sql', 'json', 'javascript'] as const
type SupportedLang = typeof SUPPORTED_LANGS[number]

let highlighterPromise: Promise<HighlighterCore> | null = null
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import('shiki/themes/github-dark-default.mjs')],
      langs: [
        import('shiki/langs/sql.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/javascript.mjs'),
      ],
      engine: createOnigurumaEngine(import('shiki/wasm')),
    })
  }
  return highlighterPromise
}

const LANG_LABELS: Record<string, string> = {
  sql: 'SQL',
  json: 'JSON',
  javascript: 'JavaScript',
  js: 'JavaScript',
}

export interface CodeViewProps {
  code: string
  language?: string
  /** Optional extra action(s) rendered in the header (e.g. an Insert button). */
  actions?: React.ReactNode
  /** When false, hides the copy button (default true). */
  showCopy?: boolean
}

export function CodeView({ code, language, actions, showCopy = true }: CodeViewProps) {
  const [html, setHtml] = useState<string | null>(null)
  const { copied, copy } = useClipboard()

  useEffect(() => {
    let cancelled = false
    const lang: SupportedLang = (SUPPORTED_LANGS as readonly string[]).includes(language || '')
      ? (language as SupportedLang)
      : 'sql'
    getHighlighter().then((hl) => {
      if (cancelled) return
      const result = hl.codeToHtml(code, { lang, theme: 'github-dark-default' })
      setHtml(DOMPurify.sanitize(result))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [code, language])

  const handleCopy = () => copy(code, { resetDelay: 1500 })

  const langLabel = LANG_LABELS[language || ''] || language || 'Code'

  return (
    <div className="my-2 rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
        <span className="text-[11px] text-[var(--color-text-secondary)]">{langLabel}</span>
        <div className="flex items-center gap-1">
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-1.5 py-0.5 rounded text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          {actions}
        </div>
      </div>
      {html ? (
        <div
          className="text-xs [&_pre]:!p-3 [&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:!text-xs [&_code]:!text-xs [&_code]:!whitespace-pre-wrap [&_code]:!break-words"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="bg-[var(--color-bg-inset)] p-3 text-xs whitespace-pre-wrap break-words">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
