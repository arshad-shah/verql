/**
 * Provider errors arrive as plain Error.message strings from IPC. The
 * provider helpers throw messages like:
 *   Anthropic API error 400: {"type":"error","error":{...}}
 *   OpenAI API error 401: {"error":{"message":"..."}}
 *   Ollama API error 500: ...
 *
 * This helper extracts the most useful part for a toast.
 */
export function extractAIErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)

  // Try to lift the structured error block out of "Provider API error N: {…}"
  const match = raw.match(/^[\w\s]+API error\s+(\d+):\s*(.+)$/)
  if (match) {
    const status = match[1]
    const body = match[2]
    try {
      const parsed = JSON.parse(body) as {
        error?: { message?: string; type?: string }
      }
      const inner = parsed.error?.message
      if (inner) return `${humanizeStatus(status)} ${inner}`
    } catch {
      // Not JSON — fall through and return the body as-is.
    }
    return `${humanizeStatus(status)} ${body}`
  }

  if (raw.includes('not configured')) return raw
  if (raw.includes('No active AI')) return 'No active AI model is selected. Pick a provider and model in Settings → AI.'
  if (raw.includes('fetch failed') || raw.includes('ECONNREFUSED')) {
    return 'Could not reach the AI provider. Check your connection or local server (e.g. Ollama).'
  }

  return raw || 'Unknown error'
}

function humanizeStatus(status: string): string {
  switch (status) {
    case '400': return 'Bad request:'
    case '401': return 'Invalid API key:'
    case '403': return 'Access denied:'
    case '404': return 'Model not found:'
    case '408':
    case '504': return 'Request timed out:'
    case '429': return 'Rate limited:'
    case '500':
    case '502':
    case '503': return 'Provider error:'
    default: return `HTTP ${status}:`
  }
}
