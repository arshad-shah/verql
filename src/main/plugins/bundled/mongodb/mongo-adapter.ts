import { MongoClient, type Db, type Document } from 'mongodb'
import type { DbAdapter } from '../../../db/adapter'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo } from '@shared/types'

const ALLOWED_OPERATIONS = new Set([
  'find',
  'findOne',
  'aggregate',
  'count',
  'distinct',
  'insertOne',
  'insertMany',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
])

export interface MongoQuery {
  collection: string
  operation: string
  filter?: Record<string, unknown>
  pipeline?: unknown[]
  limit?: number
  sort?: Record<string, unknown>
  projection?: Record<string, unknown>
  update?: Record<string, unknown>
  document?: Record<string, unknown>
  documents?: Record<string, unknown>[]
  field?: string
  options?: Record<string, unknown>
}

export function parseMongoQuery(input: string): MongoQuery {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch {
    throw new Error('Invalid query: not valid JSON')
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid query: must be a JSON object')
  }

  const obj = parsed as Record<string, unknown>

  if (!obj.collection || typeof obj.collection !== 'string') {
    throw new Error('Invalid query: missing required field "collection"')
  }

  if (!obj.operation || typeof obj.operation !== 'string') {
    throw new Error('Invalid query: missing required field "operation"')
  }

  if (!ALLOWED_OPERATIONS.has(obj.operation)) {
    throw new Error(`Unknown operation: "${obj.operation}". Allowed operations: ${[...ALLOWED_OPERATIONS].join(', ')}`)
  }

  return obj as unknown as MongoQuery
}

function flattenValue(value: unknown): unknown {
  if (value !== null && typeof value === 'object') {
    return JSON.stringify(value)
  }
  return value
}

function flattenDocument(doc: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(doc)) {
    result[key] = flattenValue(value)
  }
  return result
}

export function formatMongoResult(data: unknown, affectedRows: number): QueryResult {
  const duration = 0

  // Array of documents (read result)
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { rows: [], fields: [], rowCount: 0, duration, affectedRows }
    }

    // Collect all unique field names from first document (for column ordering)
    const firstDoc = data[0] as Record<string, unknown>
    const fieldNames = Object.keys(firstDoc)

    const fields: FieldInfo[] = fieldNames.map(name => ({
      name,
      dataType: 'unknown',
      nullable: true,
    }))

    const rows = data.map(doc => flattenDocument(doc as Record<string, unknown>))

    return { rows, fields, rowCount: rows.length, duration, affectedRows }
  }

  // Write operation result (non-array object)
  if (typeof data === 'object' && data !== null) {
    const writeRow = flattenDocument(data as Record<string, unknown>)
    return {
      rows: [writeRow],
      fields: Object.keys(writeRow).map(name => ({ name, dataType: 'unknown', nullable: true })),
      rowCount: 1,
      duration,
      affectedRows,
    }
  }

  // Scalar result (e.g. count)
  return {
    rows: [{ result: data }],
    fields: [{ name: 'result', dataType: 'unknown', nullable: true }],
    rowCount: 1,
    duration,
    affectedRows,
  }
}

export class MongoAdapter implements DbAdapter {
  private client: MongoClient | null = null
  private db: Db | null = null
  private readonly uri: string
  private currentDatabase: string

  constructor(uri: string, database: string) {
    this.uri = uri
    this.currentDatabase = database
  }

  async connect(): Promise<void> {
    this.client = new MongoClient(this.uri)
    await this.client.connect()
    this.db = this.client.db(this.currentDatabase)
  }

  async disconnect(): Promise<void> {
    await this.client?.close()
    this.client = null
    this.db = null
  }

  isConnected(): boolean {
    return this.client !== null && this.db !== null
  }

  async query(input: string, _params?: unknown[]): Promise<QueryResult> {
    if (!this.db) throw new Error('Not connected')

    const start = performance.now()
    const q = parseMongoQuery(input)
    const coll = this.db.collection<Document>(q.collection)

    let data: unknown
    let affectedRows = 0

    switch (q.operation) {
      case 'find': {
        const cursor = coll.find(q.filter ?? {})
        if (q.sort) cursor.sort(q.sort as Parameters<typeof cursor.sort>[0])
        if (q.limit) cursor.limit(q.limit)
        if (q.projection) cursor.project(q.projection)
        data = await cursor.toArray()
        break
      }
      case 'findOne': {
        const doc = await coll.findOne(q.filter ?? {}, q.projection ? { projection: q.projection } : undefined)
        data = doc ? [doc] : []
        break
      }
      case 'aggregate': {
        data = await coll.aggregate(q.pipeline ?? []).toArray()
        break
      }
      case 'count': {
        const cnt = await coll.countDocuments(q.filter ?? {})
        data = cnt
        break
      }
      case 'distinct': {
        if (!q.field) throw new Error('distinct requires a "field" property')
        data = await coll.distinct(q.field, q.filter ?? {})
        break
      }
      case 'insertOne': {
        if (!q.document) throw new Error('insertOne requires a "document" property')
        const r = await coll.insertOne(q.document as Document)
        affectedRows = 1
        data = { insertedId: r.insertedId?.toString() }
        break
      }
      case 'insertMany': {
        if (!q.documents) throw new Error('insertMany requires a "documents" property')
        const r = await coll.insertMany(q.documents as Document[])
        affectedRows = r.insertedCount
        data = { insertedCount: r.insertedCount }
        break
      }
      case 'updateOne': {
        const r = await coll.updateOne(q.filter ?? {}, q.update as Document)
        affectedRows = r.modifiedCount
        data = { matchedCount: r.matchedCount, modifiedCount: r.modifiedCount }
        break
      }
      case 'updateMany': {
        const r = await coll.updateMany(q.filter ?? {}, q.update as Document)
        affectedRows = r.modifiedCount
        data = { matchedCount: r.matchedCount, modifiedCount: r.modifiedCount }
        break
      }
      case 'deleteOne': {
        const r = await coll.deleteOne(q.filter ?? {})
        affectedRows = r.deletedCount
        data = { deletedCount: r.deletedCount }
        break
      }
      case 'deleteMany': {
        const r = await coll.deleteMany(q.filter ?? {})
        affectedRows = r.deletedCount
        data = { deletedCount: r.deletedCount }
        break
      }
      default:
        throw new Error(`Unhandled operation: ${q.operation}`)
    }

    const duration = Math.round(performance.now() - start)
    const result = formatMongoResult(data, affectedRows)
    return { ...result, duration }
  }

  async getTables(_schema?: string): Promise<SchemaTable[]> {
    if (!this.db) throw new Error('Not connected')
    const collections = await this.db.listCollections().toArray()
    return collections.map(c => ({
      name: c.name,
      schema: this.currentDatabase,
      type: 'table' as const,
    }))
  }

  async getColumns(table: string, _schema?: string): Promise<SchemaColumn[]> {
    if (!this.db) throw new Error('Not connected')
    // Sample a document to infer columns
    const doc = await this.db.collection(table).findOne({})
    if (!doc) return []
    return Object.keys(doc).map(key => ({
      name: key,
      dataType: typeof doc[key],
      nullable: true,
      defaultValue: null,
      isPrimaryKey: key === '_id',
      isForeignKey: false,
    }))
  }

  async getIndexes(table: string, _schema?: string): Promise<SchemaIndex[]> {
    if (!this.db) throw new Error('Not connected')
    const indexes = await this.db.collection(table).indexes()
    return indexes.map(idx => ({
      name: idx.name ?? '',
      columns: Object.keys(idx.key),
      unique: idx.unique ?? false,
    }))
  }

  async getRowCount(table: string, _schema?: string): Promise<number> {
    if (!this.db) throw new Error('Not connected')
    return this.db.collection(table).countDocuments()
  }

  async getSchemas(): Promise<string[]> {
    return [this.currentDatabase]
  }

  async getDatabases(): Promise<string[]> {
    if (!this.client) throw new Error('Not connected')
    const adminDb = this.client.db('admin')
    const result = await adminDb.admin().listDatabases()
    return result.databases.map((d: { name: string }) => d.name)
  }

  async switchDatabase(database: string): Promise<void> {
    if (!this.client) throw new Error('Not connected')
    this.currentDatabase = database
    this.db = this.client.db(database)
  }

  cancelQuery(): void {
    // MongoDB driver does not support query cancellation in the same way
  }
}
