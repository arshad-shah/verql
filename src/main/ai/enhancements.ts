import type { AIProviderRegistry } from './provider-registry'
import type { AIChatMessage } from '@shared/ai-types'

interface EnhancementDeps {
  providerRegistry: AIProviderRegistry
  getSchemaContext: (connectionId: string) => Promise<string>
}

interface CallOptions {
  temperature?: number
  maxTokens?: number
  stopSequences?: string[]
}

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

export function createAIEnhancements(deps: EnhancementDeps) {
  return {
    generateSql: async (request: { prompt: string; connectionId: string; schema?: string }): Promise<{ sql: string }> => {
      let schemaContext = ''
      try {
        schemaContext = await deps.getSchemaContext(request.connectionId)
      } catch { /* */ }

      const systemPrompt = `You are a SQL-generation function behind an API endpoint. Your response body is piped directly into a SQL parser — any character that is not part of a valid SQL statement will cause a fatal parse error.

Rules:
- Emit exactly one SQL statement
- No markdown, no backticks, no prose, no prefixes, no commentary
- Do not second-guess, revise, or emit multiple attempts
- If ambiguous, pick the most likely interpretation and emit one query
- End with a semicolon, then stop

${schemaContext ? `Database schema:\n${schemaContext}` : ''}

Use exact table and column names from the schema. Prefer read-only unless mutation is explicitly requested.`

      const sql = await callProvider(deps, systemPrompt, request.prompt, {
        temperature: 0,
        maxTokens: 500
      })
      return { sql: sql.trim() }
    },

    completeSql: async (request: { sql: string; cursorOffset: number; connectionId: string; schema?: string }): Promise<{ completion: string }> => {
      let schemaContext = ''
      try {
        schemaContext = await deps.getSchemaContext(request.connectionId)
      } catch { /* */ }

      const before = request.sql.slice(0, request.cursorOffset)
      const after = request.sql.slice(request.cursorOffset)

      const systemPrompt = `You are an inline SQL completion function embedded in a code editor. Your output is inserted directly at the cursor position — it is not displayed to a human as prose.

You receive a partial SQL statement with the cursor marked as |. Emit ONLY the fragment of SQL that belongs at that cursor position.

Prohibited:
- Explanations, commentary, or natural language of any kind
- Markdown formatting
- Repeating text that already appears before or after the cursor
- Complete rewrites of the query

If no meaningful completion exists, respond with an empty string. A short, precise fragment is always better than a long speculative one.

${schemaContext ? `Database schema:\n${schemaContext}` : ''}`

      const completion = await callProvider(deps, systemPrompt, `${before}|${after}`, {
        temperature: 0,
        maxTokens: 200
      })
      return { completion: completion.trim() }
    },

    explainResults: async (request: { sql: string; columns: string[]; rowCount: number; sampleRows: Record<string, unknown>[] }): Promise<{ explanation: string }> => {
      const systemPrompt = `You are a data-analysis function. Your output is rendered as plain text in a small UI panel inside a database client.

Given a SQL query and a sample of its results, produce a concise explanation:
- One sentence on what the query does.
- One to three sentences on notable patterns, distributions, or anomalies in the returned data.
- If the result set is empty or suspicious, say so.

Keep the total response under 100 words. Write in plain text — no markdown, no bold, no code fences, no bullet points.

Do not reproduce the SQL. Do not suggest alternative queries. Do not offer to help further.`

      const sampleData = request.sampleRows.slice(0, 5)
      const userPrompt = `Query: ${request.sql}

Columns: ${request.columns.join(', ')}
Total rows: ${request.rowCount}
Sample data (first ${sampleData.length} rows):
${JSON.stringify(sampleData, null, 2)}`

      const explanation = await callProvider(deps, systemPrompt, userPrompt, {
        temperature: 0.3,
        maxTokens: 300
      })
      return { explanation }
    }
  }
}
