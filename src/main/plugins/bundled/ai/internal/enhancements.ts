import type { AIProviderRegistry } from './provider-registry'
import type { AIChatMessage } from '@shared/ai-types'
import type { ConversationManager } from './conversation-manager'

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

const EXPLAIN_SYSTEM_PROMPT = `You are a data-analysis function. Your output is rendered as Markdown in a small UI panel inside a database client.

Given a query and a sample of its results, produce a concise explanation:
- One sentence on what the query does.
- One to three sentences on notable patterns, distributions, or anomalies in the returned data.
- If the result set is empty or suspicious, say so.

Keep the total response under 120 words. You may use light Markdown — short \`code\` spans for identifiers and triple-backtick fenced blocks for SQL when truly useful. Do not use headings or bullet lists.

Do not reproduce the query. Do not suggest alternative queries. Do not offer to help further.`

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

    const systemPrompt = `You are a query-generation function behind an API endpoint. Your response body is piped directly into the database driver — any character that is not part of a valid query will cause a fatal parse error.

Rules:
- Emit exactly one query
- No markdown, no backticks, no prose, no prefixes, no commentary
- Do not second-guess, revise, or emit multiple attempts
- If ambiguous, pick the most likely interpretation and emit one query
- Use the exact format expected by the connected database

${ctx.schema ? `Database schema:\n${ctx.schema}` : ''}
${ctx.queryFormat ? `\n${ctx.queryFormat}` : ''}

Use exact table and column names from the schema. Prefer read-only unless mutation is explicitly requested.`

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

    const systemPrompt = `You are an inline SQL completion function embedded in a code editor (think GitHub Copilot for SQL). Your output is INSERTED VERBATIM at the cursor — every character you emit appears in the user's file. You are NOT in a conversation. The human never sees your text as prose.

INPUT FORMAT
The user message is the buffer with a single | marking the cursor position. There is nothing before or after that buffer.

OUTPUT FORMAT
Respond with exactly one of:
  (a) The SQL fragment that belongs at the cursor, with no quoting, no markdown, no surrounding whitespace beyond what is meaningful inside the fragment.
  (b) Zero characters — a completely empty response — if no useful SQL completion exists. Do NOT explain why; do NOT emit a placeholder like a single space or a parenthesised note; do NOT emit a fenced empty code block. Silence means "no suggestion" and is the correct answer.

The request being non-SQL (e.g. "give me a react component"), schema not matching, or the cursor being in a hopeless spot are all cases where (b) — silence — is the right answer.

DECISION RULES
1. If the cursor is inside a string literal ('...' or "..."), inside a line comment (-- ...) that has not yet ended, or inside an unterminated block comment (/* ... */), return empty.
2. If the buffer ends with a line comment describing intent (-- show top 10 users by signup), generate the SQL that implements that intent and starts on the next line.
3. If the cursor is mid-token (inside an identifier or keyword without a trailing space), complete that token only — do NOT add a leading space or new keyword.
4. If the buffer is already a complete, syntactically valid statement and there is no comment-intent to act on, return empty. Do not invent new statements.
5. Match the dialect implied by the schema below (case, quoting, function names). Default to ANSI SQL when unclear.
6. Output at most one statement. Do NOT add a trailing semicolon unless the statement actually ends inside your fragment.
7. Never repeat text that already appears immediately before or after the cursor.

FORBIDDEN
- Prose, explanations, apologies, or the strings "the query", "this query", "I", "sorry", "let me", "here is".
- Markdown fences, backticks, code blocks.
- Wrapping the answer in quotes.
- Multiple statements separated by extra blank lines.

EXAMPLES (| marks the cursor; → is what you reply)

  -- top 10 users by signup date
  |
  → SELECT * FROM users ORDER BY created_at DESC LIMIT 10

  SELECT id, name
  FROM users
  WHERE |
  → active = true

  -- count orders per status
  SELECT |
  → status, COUNT(*) FROM orders GROUP BY status

  SELECT * FROM ord|
  → ers

  SELECT * FROM users;
  |
  → (empty — buffer is complete, no comment intent)

  SELECT 'hello |world' FROM dual
  → (empty — cursor is inside a string)

${ctx.schema ? `\nDATABASE SCHEMA:\n${ctx.schema}` : ''}
${ctx.queryFormat ? `\n${ctx.queryFormat}` : ''}`

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
      const systemPrompt = `You are summarizing a conversation between a user and an AI database assistant. Produce a compact summary (under 200 words) that future turns can rely on instead of the full history.

Capture:
- The user's overall goal in this conversation.
- Key identifiers, table/column names, and decisions established.
- Important facts the assistant has been told or has discovered (schema details, prior query results, constraints).
- The current state of work — what was last done, what's pending.

Omit pleasantries and turn-by-turn play-by-play. Write in third person ("The user asked…", "The assistant identified…"). Output plain prose, no headings, no bullet lists.`

      const transcript = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n')

      const summary = await callProvider(deps, systemPrompt, transcript, {
        temperature: 0.2,
        maxTokens: 500,
      })
      return { summary: summary.trim() }
    },
  }
}
