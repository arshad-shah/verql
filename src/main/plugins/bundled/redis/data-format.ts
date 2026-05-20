import type { DbAdapter } from '../../../db/adapter'
import type { SchemaColumn } from '@shared/types'
import type { RegisteredExporter } from '../../sdk/exporter-registry'
import type { RegisteredImporter } from '../../sdk/importer-registry'

/**
 * In Redis, "tables" are key prefixes. `getTableData` walks every key matching
 * `${prefix}:*` and emits `{ key, value }` rows. Special characters in the
 * prefix are escaped so the user can name a "table" containing glob chars
 * without it expanding into a wildcard.
 */
function escapeRedisGlob(s: string): string {
  return s.replace(/[*?[\]\\]/g, '\\$&')
}

export async function getTableData(
  adapter: DbAdapter,
  table: string,
  _schema?: string
): Promise<{ rows: Record<string, unknown>[]; columns: SchemaColumn[] }> {
  const escaped = escapeRedisGlob(table)
  // The adapter's query() parses space-separated command syntax; we control
  // the prefix, so this is not user-attacker-controlled SQL.
  const keysResult = await adapter.query(`KEYS ${escaped}:*`)
  const keys = keysResult.rows.map(r => String(r.value ?? r['0'] ?? ''))
    .filter(k => k.length > 0)
  const rows: Record<string, unknown>[] = []
  for (const key of keys) {
    try {
      // TYPE then a type-appropriate read. Each command is a single Redis
      // call, so injection-via-key is constrained to whatever Redis itself
      // accepts as a key name — and Redis keys are binary-safe, not parsed.
      const typeRes = await adapter.query(`TYPE ${key}`)
      const type = String(typeRes.rows[0]?.value ?? 'string')
      let value: unknown
      switch (type) {
        case 'string':
          value = (await adapter.query(`GET ${key}`)).rows[0]?.value
          break
        case 'list':
          value = (await adapter.query(`LRANGE ${key} 0 -1`)).rows.map(r => r.value)
          break
        case 'set':
          value = (await adapter.query(`SMEMBERS ${key}`)).rows.map(r => r.value)
          break
        case 'hash':
          value = (await adapter.query(`HGETALL ${key}`)).rows.reduce(
            (acc, r) => ({ ...acc, [String(r.field)]: r.value }), {})
          break
        case 'zset':
          value = (await adapter.query(`ZRANGE ${key} 0 -1 WITHSCORES`)).rows.map(r => r.value)
          break
        default:
          value = null
      }
      rows.push({ key, type, value })
    } catch {
      rows.push({ key, type: 'unknown', value: null })
    }
  }
  const columns: SchemaColumn[] = [
    { name: 'key', dataType: 'string', nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: null },
    { name: 'type', dataType: 'string', nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: null },
    { name: 'value', dataType: 'any', nullable: true, isPrimaryKey: false, isForeignKey: false, defaultValue: null }
  ]
  return { rows, columns }
}

export const jsonExporter: RegisteredExporter = {
  format: 'json',
  extension: 'json',
  displayName: 'JSON (Redis key/value)',
  appliesTo: (t) => t === 'redis',
  execute(rows) {
    return JSON.stringify(rows, null, 2)
  }
}
