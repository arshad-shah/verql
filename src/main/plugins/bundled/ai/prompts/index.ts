/**
 * All AI prompt templates live as `.md` files alongside this module. Vite
 * inlines them at build time via the `?raw` query suffix so there's no
 * runtime filesystem access in packaged builds, and so the markdown source
 * is the single editable surface for prompt changes — no prompt string text
 * exists in the AI layer code itself.
 *
 * Placeholders use `{{name}}` and are filled by `render()`. Missing keys
 * expand to empty, then triple-or-more blank lines collapse to a single
 * blank line so optional blocks don't leave gaping holes in the output.
 */
import chatSystemTemplate from './chat-system.md?raw'
import chatFragmentsRaw from './chat-fragments.md?raw'
import explainTemplate from './explain.md?raw'
import generateQueryTemplate from './generate-query.md?raw'
import inlineCompleteTemplate from './inline-complete.md?raw'
import summarizeTemplate from './summarize.md?raw'

function render(template: string, vars: Record<string, string>): string {
  return template
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Parse `chat-fragments.md`. Each fragment is delimited by `=== name ===` on
 * its own line. Returns an empty record only if the file is malformed (which
 * a test guards against), so callers can trust every expected key is there.
 */
function loadFragments(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  const parts = raw.split(/^=== (\w+) ===\s*$/m)
  // parts[0] is the preamble before the first marker; ignore it.
  // After that the array alternates [name, body, name, body, ...].
  for (let i = 1; i + 1 < parts.length; i += 2) {
    out[parts[i]] = parts[i + 1].trim()
  }
  return out
}

const fragments = loadFragments(chatFragmentsRaw)

export interface ChatSystemVars {
  connection?: { driverName: string; type: string }
  schema?: string
  conversationContext?: string
  connectionsList?: string
  notificationsList?: string
  appActionsCatalog?: string
}

export function buildChatSystemPrompt(vars: ChatSystemVars): string {
  const slots: Record<string, string> = {
    connection: '',
    schema: '',
    conversation_context: '',
    connections: '',
    notifications: '',
    deep_links: '',
  }

  if (vars.connection) {
    slots.connection = render(fragments.connection, {
      driverName: vars.connection.driverName,
      type: vars.connection.type,
    })
  }
  if (vars.schema && vars.schema.trim()) {
    slots.schema = render(fragments.schema, { schema: vars.schema })
  }
  if (vars.conversationContext && vars.conversationContext.trim()) {
    slots.conversation_context = render(fragments.conversation_context, { context: vars.conversationContext })
  }
  if (vars.connectionsList && vars.connectionsList.trim()) {
    slots.connections = render(fragments.connections, { list: vars.connectionsList })
  }
  if (vars.notificationsList && vars.notificationsList.trim()) {
    slots.notifications = render(fragments.notifications, { list: vars.notificationsList })
  }
  if (vars.appActionsCatalog && vars.appActionsCatalog.trim()) {
    slots.deep_links = render(fragments.deep_links, { catalog: vars.appActionsCatalog })
  }

  return render(chatSystemTemplate, slots)
}

export function buildExplainPrompt(): string {
  return render(explainTemplate, {})
}

export interface SqlContextVars {
  schema?: string
  queryFormat?: string
}

function sqlContextSlots(vars: SqlContextVars): Record<string, string> {
  return {
    schema_block: vars.schema?.trim() ? `DATABASE SCHEMA:\n${vars.schema}` : '',
    query_format_block: vars.queryFormat?.trim() ? vars.queryFormat : '',
  }
}

export function buildGenerateQueryPrompt(vars: SqlContextVars): string {
  return render(generateQueryTemplate, sqlContextSlots(vars))
}

export function buildInlineCompletePrompt(vars: SqlContextVars): string {
  return render(inlineCompleteTemplate, sqlContextSlots(vars))
}

export function buildSummarizePrompt(): string {
  return render(summarizeTemplate, {})
}

// Raw templates are re-exported so tests can assert structural anchors
// (key phrases, examples sections) without reaching back into the file
// system.
export const RAW_TEMPLATES = {
  chatSystem: chatSystemTemplate,
  chatFragments: chatFragmentsRaw,
  explain: explainTemplate,
  generateQuery: generateQueryTemplate,
  inlineComplete: inlineCompleteTemplate,
  summarize: summarizeTemplate,
}
