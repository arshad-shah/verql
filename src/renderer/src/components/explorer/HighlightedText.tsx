import { memo, useMemo } from 'react'
import { fuzzyMatch } from '@/lib/fuzzy-match'

interface HighlightedTextProps {
  text: string
  query: string
  className?: string
}

/**
 * Renders `text` with characters that participated in the fuzzy match against
 * `query` visually emphasized. Falls back to plain text when no query.
 */
export const HighlightedText = memo(function HighlightedText({
  text,
  query,
  className,
}: HighlightedTextProps) {
  const positions = useMemo(() => {
    if (!query) return null
    const m = fuzzyMatch(query, text)
    return m ? new Set(m.positions) : null
  }, [text, query])

  if (!positions || positions.size === 0) {
    return <span className={className}>{text}</span>
  }

  const parts: { ch: string; hit: boolean }[] = []
  for (let i = 0; i < text.length; i++) {
    parts.push({ ch: text[i], hit: positions.has(i) })
  }

  // Coalesce adjacent runs
  const runs: { text: string; hit: boolean }[] = []
  for (const p of parts) {
    const last = runs[runs.length - 1]
    if (last && last.hit === p.hit) last.text += p.ch
    else runs.push({ text: p.ch, hit: p.hit })
  }

  return (
    <span className={className}>
      {runs.map((r, i) =>
        r.hit ? (
          <mark
            key={i}
            className="rounded-[2px] px-[1px]"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
            }}
          >
            {r.text}
          </mark>
        ) : (
          <span key={i}>{r.text}</span>
        )
      )}
    </span>
  )
})
