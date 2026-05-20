/**
 * Generic default-schema resolver. Driver-specific knowledge (e.g. "MySQL uses
 * the connection database as the default schema, SQLite uses 'main', Postgres
 * uses 'public', Snowflake prefers uppercase 'PUBLIC') lives in each driver
 * plugin's serialisable capabilities — the renderer never branches on db type.
 */
export interface DefaultSchemaSpec {
  /** When true, prefer the connection's `database` field if it's in the
   *  schema list. MySQL works this way: schemas and databases are the same. */
  defaultSchemaUseConnectionDatabase?: boolean
  /** Ordered list of candidate names to try inside the schema list. The first
   *  one that matches wins. */
  defaultSchemaCandidates?: string[]
}

export function pickDefaultSchema(
  spec: DefaultSchemaSpec,
  schemas: string[],
  connectionDatabase: string | undefined
): string | undefined {
  if (schemas.length === 0) return undefined
  if (spec.defaultSchemaUseConnectionDatabase
      && connectionDatabase
      && schemas.includes(connectionDatabase)) {
    return connectionDatabase
  }
  for (const candidate of spec.defaultSchemaCandidates ?? []) {
    if (schemas.includes(candidate)) return candidate
  }
  return schemas[0]
}
