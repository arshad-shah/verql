import type { Monaco } from '@monaco-editor/react'
import type { editor, Position, CancellationToken, languages } from 'monaco-editor'
import { IPC_CHANNELS } from '@shared/ipc'

export type InlineAIState = 'idle' | 'thinking' | 'ready'

type Listener = (s: InlineAIState) => void

const DEBOUNCE_MS = 350
const MIN_TRIGGER_CHARS = 3

let currentConnectionId: string | null = null
let state: InlineAIState = 'idle'
const listeners = new Set<Listener>()
let debounceTimer: ReturnType<typeof setTimeout> | null = null
type Pending = { resolve: (v: { items: languages.InlineCompletion[] }) => void; token: CancellationToken }
let pending: Pending | null = null
const ENABLED_KEY = 'verql:ai-inline-completion-enabled'
let enabled = readEnabled()

function readEnabled(): boolean {
  try {
    if (typeof localStorage === 'undefined') return true
    const raw = localStorage.getItem(ENABLED_KEY)
    return raw == null ? true : raw === 'true'
  } catch {
    return true
  }
}

export function isInlineCompletionEnabled(): boolean {
  return enabled
}

export function setInlineCompletionEnabled(next: boolean): void {
  enabled = next
  try { localStorage.setItem(ENABLED_KEY, String(next)) } catch { /* quota */ }
  if (!next) setState('idle')
}

function setState(next: InlineAIState): void {
  if (state === next) return
  state = next
  for (const l of listeners) l(state)
}

export function getInlineAIState(): InlineAIState {
  return state
}

export function subscribeInlineAIState(l: Listener): () => void {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

export function setAICompletionContext(connectionId: string | null): void {
  currentConnectionId = connectionId
}

/**
 * True when the cursor in `text` is inside a string literal or a comment.
 * The check is a lightweight single-pass scan, not a SQL parser — good
 * enough to skip the IPC call (and avoid the model wasting a turn) when
 * the user is mid-typing inside a string or comment.
 */
function isInsideStringOrComment(text: string, offset: number): boolean {
  let i = 0
  let inSingle = false
  let inDouble = false
  let inLineComment = false
  let inBlockComment = false
  while (i < offset && i < text.length) {
    const c = text[i]
    const next = text[i + 1]
    if (inLineComment) {
      if (c === '\n') inLineComment = false
      i++
      continue
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') { inBlockComment = false; i += 2; continue }
      i++
      continue
    }
    if (inSingle) {
      if (c === "'" && text[i - 1] !== '\\') inSingle = false
      i++
      continue
    }
    if (inDouble) {
      if (c === '"' && text[i - 1] !== '\\') inDouble = false
      i++
      continue
    }
    if (c === '-' && next === '-') { inLineComment = true; i += 2; continue }
    if (c === '/' && next === '*') { inBlockComment = true; i += 2; continue }
    if (c === "'") { inSingle = true; i++; continue }
    if (c === '"') { inDouble = true; i++; continue }
    i++
  }
  return inSingle || inDouble || inLineComment || inBlockComment
}

/**
 * True when the text up to the cursor ends with a line-comment intent —
 * `-- something\n` (optionally with trailing whitespace). This is the
 * one auto-trigger we honour: the user wrote what they want and pressed
 * Enter; the next line is where the SQL should go.
 */
function endsWithCommentIntent(before: string): boolean {
  // Match either: "...comment\n" (optionally with extra blank lines/whitespace
  // before the cursor) where the comment content is non-empty.
  return /--[^\n]*\n\s*$/.test(before)
}

/**
 * Drop completions that don't carry value: just whitespace, a fragment that
 * already exists immediately after the cursor, or just punctuation.
 */
function isUselessCompletion(completion: string, after: string): boolean {
  const trimmed = completion.replace(/^\s+/, '')
  if (!trimmed) return true
  if (!/[a-z0-9_]/i.test(trimmed)) return true
  // Duplicate-of-suffix check: if the next chars after the cursor already
  // start with what we'd insert, accepting would create double-text.
  const afterStart = after.replace(/^\s+/, '').slice(0, trimmed.length)
  if (afterStart && afterStart === trimmed.slice(0, afterStart.length)) return true
  return false
}

function clearPending(): void {
  if (pending) {
    pending.resolve({ items: [] })
    pending = null
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

export function registerAIInlineCompletionProvider(monaco: Monaco, language: string): void {
  monaco.languages.registerInlineCompletionsProvider(language, {
    provideInlineCompletions: async (
      model: editor.ITextModel,
      position: Position,
      context: languages.InlineCompletionContext,
      token: CancellationToken
    ): Promise<{ items: languages.InlineCompletion[] }> => {
      if (!enabled) return { items: [] }
      if (!currentConnectionId) return { items: [] }

      // Any in-flight request is now stale — resolve it with empty so Monaco
      // doesn't sit waiting and we don't leak the promise resolver.
      clearPending()

      const fullText = model.getValue()
      const offset = model.getOffsetAt(position)
      const before = fullText.slice(0, offset)
      const after = fullText.slice(offset)

      // Cheap pre-checks before spending tokens.
      if (fullText.trim().length < MIN_TRIGGER_CHARS) return { items: [] }
      if (isInsideStringOrComment(fullText, offset)) return { items: [] }
      // Avoid completing inside a word the user is still typing (Monaco's own
      // suggestion widget handles those better).
      const charBefore = before[before.length - 1] ?? ''
      const charAfter = after[0] ?? ''
      if (/[a-z0-9_]/i.test(charBefore) && /[a-z0-9_]/i.test(charAfter)) return { items: [] }

      // Auto-trigger gating: every keystroke calls this provider with
      // triggerKind=Automatic (0). To avoid burning tokens on every
      // edit we only proceed automatically when the buffer carries a
      // strong intent signal — a comment line followed by newline (the
      // user just finished writing what they want). For all other
      // automatic calls we wait for an Explicit trigger (Cmd+\ binds
      // editor.action.inlineSuggest.trigger; Tab on a previously-shown
      // suggestion also counts as an explicit re-trigger).
      // triggerKind values: Automatic = 0, Explicit = 1.
      const triggerKind = (context as unknown as { triggerKind?: number }).triggerKind ?? 0
      if (triggerKind === 0 && !endsWithCommentIntent(before)) {
        return { items: [] }
      }

      return new Promise((resolve) => {
        pending = { resolve, token }
        debounceTimer = setTimeout(async () => {
          debounceTimer = null
          if (token.isCancellationRequested) { pending = null; resolve({ items: [] }); return }

          setState('thinking')
          try {
            const result = await window.electronAPI.invoke(IPC_CHANNELS.AI_COMPLETE_SQL, {
              sql: fullText,
              cursorOffset: offset,
              connectionId: currentConnectionId!,
            }) as { completion: string }

            // Re-check: token may have fired during the IPC roundtrip, or a
            // newer request may have superseded this one.
            if (token.isCancellationRequested || pending?.token !== token) {
              setState('idle')
              pending = null
              resolve({ items: [] })
              return
            }
            const text = (result.completion ?? '').replace(/\s+$/, '')
            if (!text || isUselessCompletion(text, after)) {
              setState('idle')
              pending = null
              resolve({ items: [] })
              return
            }

            setState('ready')
            pending = null
            resolve({
              items: [{
                insertText: text,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              }],
            })
          } catch {
            setState('idle')
            pending = null
            resolve({ items: [] })
          }
        }, DEBOUNCE_MS)
      })
    },
    freeInlineCompletions: () => { setState('idle') },
    disposeInlineCompletions: () => { setState('idle') },
  } as Parameters<typeof monaco.languages.registerInlineCompletionsProvider>[1])
}
