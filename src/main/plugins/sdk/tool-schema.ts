import { toJSONSchema } from 'zod'
import type { z } from 'zod'

const WRITE_KEYWORDS_RE =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|GRANT|REVOKE)\b/i

/**
 * True if the SQL contains a write/DDL statement anywhere. Comments are
 * stripped first so writes can't hide behind `-- ...` or block comments, and a
 * leading `SELECT 1; DROP ...` is caught because we scan the whole string,
 * not just the first keyword. Intentionally conservative — a read that *names*
 * a table like `delete_log`, or calls the `REPLACE()` string function, trips an
 * approval prompt. That false-positive cost is acceptable: the worst case is an
 * extra confirmation, never a silently-executed write. The keyword set is kept
 * identical to the original MCP guard on purpose; tightening it (e.g.
 * `REPLACE\s+INTO`) is a deliberate security change, not a refactor side-effect.
 */
export function isWriteQuery(sql: string): boolean {
  const stripped = sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
  return WRITE_KEYWORDS_RE.test(stripped)
}

interface JsonSchemaObject {
  type?: string
  properties?: Record<string, unknown>
  required?: string[]
  [k: string]: unknown
}

/** Derive a JSON Schema (for LLM tool definitions) from a Zod object schema. */
export function toJsonSchema(schema: z.ZodTypeAny): JsonSchemaObject {
  return toJSONSchema(schema) as JsonSchemaObject
}
