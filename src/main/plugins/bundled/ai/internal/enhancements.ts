import type { AIProviderRegistry } from './provider-registry'
import type { AIChatMessage } from '@shared/ai-types'
import type { ConversationManager } from './conversation-manager'
import {
  buildExplainPrompt,
  buildGenerateQueryPrompt,
  buildInlineCompletePrompt,
  buildSummarizePrompt,
} from '../prompts'

interface EnhancementDeps {
  providerRegistry: AIProviderRegistry
  getSchemaContext: (connectionId: string) => Promise<string>
  conversationManager: ConversationManager
}

interface CallOptions {
  temperature?: number
  maxTokens?: number
  stopSequences?: string[]
}

// Prompt templates live in `../prompts/*.md`. We compile them once at
// module load — `buildExplainPrompt()` / `buildSummarizePrompt()` take no
// args, so caching the result avoids re-running the placeholder pass on
// every call. The dynamic ones (`generate`/`complete`) accept the schema
// context as a parameter and are rebuilt per request.
const EXPLAIN_SYSTEM_PROMPT = buildExplainPrompt()
const SUMMARIZE_SYSTEM_PROMPT = buildSummarizePrompt()

async function callProvider(
  deps: EnhancementDeps,
  systemPrompt: string,
  userPrompt: string,
  options?: CallOptions
): Promise<string> {
  const provider = deps.providerRegistry.getActive()
  if (!provider) throw new Error('No active AI provider configured')

  const modelId = deps.providerRegistry.getActiveModel()
  if (!modelId) throw new Error('No active AI model configured')

  const messages: AIChatMessage[] = [
    { id: 'system', role: 'system', content: systemPrompt, timestamp: 0 },
    { id: 'user', role: 'user', content: userPrompt, timestamp: Date.now() }
  ]

  let result = ''
  for await (const chunk of provider.chat({
    model: modelId,
    messages,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
    stopSequences: options?.stopSequences
  })) {
    if (chunk.type === 'text' && chunk.content) {
      result += chunk.content
    }
    if (chunk.type === 'done' || chunk.type === 'error') break
  }
  return result
}

async function callProviderStreaming(
  deps: EnhancementDeps,
  systemPrompt: string,
  userPrompt: string,
  options: CallOptions | undefined,
  onToken: (text: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const provider = deps.providerRegistry.getActive()
  if (!provider) throw new Error('No active AI provider configured')

  const modelId = deps.providerRegistry.getActiveModel()
  if (!modelId) throw new Error('No active AI model configured')

  const messages: AIChatMessage[] = [
    { id: 'system', role: 'system', content: systemPrompt, timestamp: 0 },
    { id: 'user', role: 'user', content: userPrompt, timestamp: Date.now() },
  ]

  for await (const chunk of provider.chat({
    model: modelId,
    messages,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
    stopSequences: options?.stopSequences,
  })) {
    if (signal.aborted) break
    if (chunk.type === 'text' && chunk.content) onToken(chunk.content)
    if (chunk.type === 'done') break
    if (chunk.type === 'error') throw new Error(chunk.error ?? 'Provider error')
  }
}

/**
 * Last-line defence against model outputs that violate the inline-completion
 * contract. The model occasionally:
 *   - wraps SQL in a markdown fence (with prose around it),
 *   - emits refusal sentences ("This query is already complete…"),
 *   - returns prose mixed with code,
 *   - emits a junk prefix before a fence.
 * We extract the first fenced block when present, then reject anything that
 * still looks like English prose. The editor shows no ghost text rather than
 * a sentence pretending to be SQL.
 */
function sanitizeCompletion(raw: string): string {
  let s = raw
  // If the response contains a fenced block anywhere, take only the FIRST
  // block and discard everything else (prose before/after the fence).
  const fence = s.match(/```(?:sql)?\s*\n?([\s\S]*?)\n?```/i)
  if (fence) s = fence[1]
  // Drop leftover stray backticks.
  s = s.replace(/^`+|`+$/g, '')
  // Drop any trailing comment that explains the SQL.
  s = s.replace(/\n--[^\n]*$/g, '')

  const trimmed = s.trim()
  if (!trimmed) return ''
  if (!/[a-z0-9_]/i.test(trimmed)) return ''
  // The model should emit SQL that goes BELOW a comment-intent, never echo
  // the comment back. A leading `--` is almost always a refusal-echo of
  // what the user already typed.
  if (trimmed.startsWith('--')) return ''
  // A response made of only comments is the same problem — drop it.
  const nonComment = trimmed.split('\n').filter(l => l.trim() && !l.trim().startsWith('--'))
  if (nonComment.length === 0) return ''

  const lower = trimmed.toLowerCase()

  // Any of these markers anywhere → the model is talking, not coding.
  const PROSE_MARKERS = [
    'i cannot', 'i can’t', "i can't", 'i will not', "i won't",
    'i would', 'i should', "i'm sorry", 'sorry', 'apolog',
    'this query', 'the query is', 'the query already',
    'there is nothing', 'there are no', "there isn't",
    'no completion', 'no meaningful', 'nothing to add',
    'sql query context', 'sql query builder', 'query context',
    'database context', 'react code', 'react component',
    'not sql', 'is not sql', 'isn’t sql', "isn't sql",
    "here's just", 'here is just', 'just the completion',
    'as an ai', 'as a language model',
    'note:', 'note that', 'note —', 'please ',
    'single space', 'placeholder',
  ]
  for (const marker of PROSE_MARKERS) {
    if (lower.includes(marker)) return ''
  }

  // Sentence-shape heuristic: ". X" where X is a capital letter looks like
  // prose ("LIMIT 10. Here's the…"). SQL rarely has that pattern outside of
  // strings, and we already filter those above.
  if (/\.\s+[A-Z]/.test(s)) return ''

  // Multi-line response where ≥2 lines look like prose (have spaces, end in
  // period, lack SQL keywords) → drop.
  const lines = s.split('\n').map(l => l.trim()).filter(Boolean)
  const proseLines = lines.filter(l =>
    l.length > 20 && /\s/.test(l) && !/(\bselect\b|\bfrom\b|\bwhere\b|\bjoin\b|\bgroup\b|\border\b|\binsert\b|\bupdate\b|\bdelete\b|\bcreate\b|\balter\b|\bdrop\b|\bwith\b|\bvalues\b|\bset\b|\bin\b|\band\b|\bor\b|\bon\b|\bas\b|\bcase\b|\bwhen\b|\bthen\b|\belse\b|\bend\b|\bunion\b|\blimit\b|\boffset\b|\bhaving\b|\bdistinct\b)/i.test(l)
  )
  if (proseLines.length >= 1 && lines.length > 1) return ''

  return s
}

async function getDbContext(deps: EnhancementDeps, connectionId: string): Promise<{ schema: string; queryFormat: string }> {
  let schema = ''
  try {
    schema = await deps.getSchemaContext(connectionId)
  } catch { /* */ }

  let queryFormat = ''
  try {
    queryFormat = await deps.conversationManager.getContextForConnection(connectionId)
  } catch { /* */ }

  return { schema, queryFormat }
}

export function createAIEnhancements(deps: EnhancementDeps) {
  async function generateQuery(request: { prompt: string; connectionId: string; schema?: string }): Promise<{ query: string }> {
    const ctx = await getDbContext(deps, request.connectionId)

    const systemPrompt = buildGenerateQueryPrompt({ schema: ctx.schema, queryFormat: ctx.queryFormat })

    const query = await callProvider(deps, systemPrompt, request.prompt, {
      temperature: 0,
      maxTokens: 500
    })
    return { query: query.trim() }
  }

  async function completeQuery(request: { sql: string; cursorOffset: number; connectionId: string; schema?: string }): Promise<{ completion: string }> {
    const ctx = await getDbContext(deps, request.connectionId)

    const before = request.sql.slice(0, request.cursorOffset)
    const after = request.sql.slice(request.cursorOffset)

    const systemPrompt = buildInlineCompletePrompt({ schema: ctx.schema, queryFormat: ctx.queryFormat })

    const completion = await callProvider(deps, systemPrompt, `${before}|${after}`, {
      temperature: 0,
      maxTokens: 200
    })
    return { completion: sanitizeCompletion(completion) }
  }

  return {
    generateQuery,

    /** @deprecated Use generateQuery — returns { query } instead of { sql } */
    generateSql: async (request: { prompt: string; connectionId: string; schema?: string }): Promise<{ sql: string }> => {
      const result = await generateQuery(request)
      return { sql: result.query }
    },

    completeQuery,

    /** @deprecated Use completeQuery */
    completeSql: async (request: { sql: string; cursorOffset: number; connectionId: string; schema?: string }): Promise<{ completion: string }> => {
      return completeQuery(request)
    },

    explainResults: async (request: { sql: string; columns: string[]; rowCount: number; sampleRows: Record<string, unknown>[] }): Promise<{ explanation: string; model: string; durationMs: number }> => {
      const sampleData = request.sampleRows.slice(0, 5)
      const userPrompt = `Query: ${request.sql}

Columns: ${request.columns.join(', ')}
Total rows: ${request.rowCount}
Sample data (first ${sampleData.length} rows):
${JSON.stringify(sampleData, null, 2)}`

      const startedAt = Date.now()
      const explanation = await callProvider(deps, EXPLAIN_SYSTEM_PROMPT, userPrompt, {
        temperature: 0.3,
        maxTokens: 400
      })
      const model = deps.providerRegistry.getActiveModel() ?? 'unknown'
      return { explanation, model, durationMs: Date.now() - startedAt }
    },

    explainResultsStream: async (
      request: { sql: string; columns: string[]; rowCount: number; sampleRows: Record<string, unknown>[] },
      onToken: (text: string) => void,
      signal: AbortSignal,
    ): Promise<{ model: string; durationMs: number }> => {
      const sampleData = request.sampleRows.slice(0, 5)
      const userPrompt = `Query: ${request.sql}

Columns: ${request.columns.join(', ')}
Total rows: ${request.rowCount}
Sample data (first ${sampleData.length} rows):
${JSON.stringify(sampleData, null, 2)}`

      const startedAt = Date.now()
      await callProviderStreaming(deps, EXPLAIN_SYSTEM_PROMPT, userPrompt, {
        temperature: 0.3,
        maxTokens: 400,
      }, onToken, signal)
      const model = deps.providerRegistry.getActiveModel() ?? 'unknown'
      return { model, durationMs: Date.now() - startedAt }
    },

    summarizeConversation: async (messages: AIChatMessage[]): Promise<{ summary: string }> => {
      const transcript = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n')

      const summary = await callProvider(deps, SUMMARIZE_SYSTEM_PROMPT, transcript, {
        temperature: 0.2,
        maxTokens: 500,
      })
      return { summary: summary.trim() }
    },
  }
}
