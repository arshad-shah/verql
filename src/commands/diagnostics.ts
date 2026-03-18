import inquirer from 'inquirer'
import { createSpinner } from 'nanospinner'
import type { DbAdapter } from '../db/adapter.js'
import type { DbType } from '../config/store.js'
import { theme, box, divider, renderTable, stripAnsi } from '../ui/theme.js'

const W = () => process.stdout.columns ?? 120

function fmtBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`
  return `${n} B`
}

function sparkBar(pct: number, width = 20): string {
  const filled = Math.round((pct / 100) * width)
  const empty = width - filled
  const color = pct > 90 ? theme.error : pct > 70 ? theme.warn : theme.success
  return color('█'.repeat(filled)) + theme.dim('░'.repeat(empty)) + theme.muted(` ${pct.toFixed(1)}%`)
}

async function runQuery(adapter: DbAdapter, sql: string): Promise<Record<string, any>[]> {
  const res = await adapter.query(sql)
  if (res.error) throw new Error(res.error)
  return res.rows
}

// ─── PostgreSQL diagnostics ──────────────────────────────────────────────────

async function pgOverview(adapter: DbAdapter): Promise<void> {
  const rows = await runQuery(adapter,
    `SELECT current_database() as db,
       pg_size_pretty(pg_database_size(current_database())) as size,
       (SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema')) as tables,
       (SELECT count(*) FROM pg_stat_activity) as connections,
       (SELECT setting FROM pg_settings WHERE name='max_connections') as max_conn,
       version() as version`)
  const r = rows[0]
  const lines = [
    `${theme.label('Database'.padEnd(16))} ${theme.value(r.db)}`,
    `${theme.label('Version'.padEnd(16))} ${theme.value(r.version.split(',')[0])}`,
    `${theme.label('Size'.padEnd(16))} ${theme.value(r.size)}`,
    `${theme.label('Tables'.padEnd(16))} ${theme.value(r.tables)}`,
    `${theme.label('Connections'.padEnd(16))} ${theme.value(`${r.connections} / ${r.max_conn}`)}`,
  ]
  // Cache hit ratio
  try {
    const cache = await runQuery(adapter,
      `SELECT round(sum(heap_blks_hit)::numeric / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100, 2) as pct
       FROM pg_statio_user_tables`)
    const pct = Number(cache[0]?.pct ?? 0)
    lines.push(`${theme.label('Cache hit'.padEnd(16))} ${sparkBar(pct)}`)
  } catch {}
  console.log(box('Database Overview', lines, W(), theme.primary))
}

async function pgTableSizes(adapter: DbAdapter, schema: string): Promise<void> {
  const rows = await runQuery(adapter,
    `SELECT relname as table_name,
       pg_total_relation_size(relid) as total_bytes,
       pg_relation_size(relid) as table_bytes,
       pg_indexes_size(relid) as index_bytes,
       n_live_tup as rows
     FROM pg_stat_user_tables WHERE schemaname = '${schema}'
     ORDER BY pg_total_relation_size(relid) DESC`)
  if (rows.length === 0) { console.log(theme.muted('\n  No tables found.\n')); return }
  const maxSize = Math.max(...rows.map((r) => Number(r.total_bytes)), 1)
  const formatted = rows.map((r) => ({
    'Table': r.table_name,
    'Total': fmtBytes(Number(r.total_bytes)),
    'Data': fmtBytes(Number(r.table_bytes)),
    'Indexes': fmtBytes(Number(r.index_bytes)),
    'Rows': String(r.rows ?? '?'),
    'Bar': sparkBar((Number(r.total_bytes) / maxSize) * 100, 15),
  }))
  const { output } = renderTable(['Table', 'Total', 'Data', 'Indexes', 'Rows', 'Bar'], formatted, { pageSize: 40 })
  console.log('\n' + divider('Table Sizes', W()))
  console.log(output)
}

async function pgBloat(adapter: DbAdapter, schema: string): Promise<void> {
  const rows = await runQuery(adapter,
    `SELECT relname as table_name, n_dead_tup as dead, n_live_tup as live,
       round(n_dead_tup::numeric / nullif(n_live_tup + n_dead_tup, 0) * 100, 2) as dead_pct,
       pg_size_pretty(pg_total_relation_size(relid)) as size
     FROM pg_stat_user_tables WHERE schemaname = '${schema}'
     ORDER BY n_dead_tup DESC`)
  const formatted = rows.map((r) => {
    const pct = Number(r.dead_pct ?? 0)
    const indicator = pct > 20 ? theme.error('!!') : pct > 5 ? theme.warn('!') : theme.success('OK')
    return {
      '': indicator, 'Table': r.table_name,
      'Dead tuples': String(r.dead), 'Live tuples': String(r.live),
      'Bloat %': pct > 0 ? sparkBar(pct, 12) : theme.muted('0%'),
      'Size': r.size,
    }
  })
  const { output } = renderTable(['', 'Table', 'Dead tuples', 'Live tuples', 'Bloat %', 'Size'], formatted, { pageSize: 40 })
  console.log('\n' + divider('Table Bloat', W()))
  console.log(output)
  const badTables = rows.filter((r) => Number(r.dead_pct) > 20)
  if (badTables.length > 0) {
    console.log(theme.warn(`\n  ${badTables.length} table(s) have >20% bloat. Consider running VACUUM ANALYZE.\n`))
  }
}

async function pgIndexUsage(adapter: DbAdapter, schema: string): Promise<void> {
  const rows = await runQuery(adapter,
    `SELECT relname as table_name, indexrelname as index_name,
       idx_scan as scans, idx_tup_read as tuples_read,
       pg_size_pretty(pg_relation_size(indexrelid)) as size,
       pg_relation_size(indexrelid) as size_bytes
     FROM pg_stat_user_indexes WHERE schemaname = '${schema}'
     ORDER BY idx_scan ASC`)
  const formatted = rows.map((r) => {
    const scans = Number(r.scans)
    const status = scans === 0 ? theme.error('UNUSED') : scans < 10 ? theme.warn('LOW') : theme.success('ACTIVE')
    return {
      '': status, 'Table': r.table_name, 'Index': r.index_name,
      'Scans': String(scans), 'Tuples read': String(r.tuples_read), 'Size': r.size,
    }
  })
  const { output } = renderTable(['', 'Table', 'Index', 'Scans', 'Tuples read', 'Size'], formatted, { pageSize: 40 })
  console.log('\n' + divider('Index Usage', W()))
  console.log(output)
  const unused = rows.filter((r) => Number(r.scans) === 0)
  if (unused.length > 0) {
    const wasted = unused.reduce((sum, r) => sum + Number(r.size_bytes), 0)
    console.log(theme.warn(`\n  ${unused.length} unused index(es) wasting ${fmtBytes(wasted)}. Consider dropping them.\n`))
  }
}

async function pgSlowQueries(adapter: DbAdapter): Promise<void> {
  const rows = await runQuery(adapter,
    `SELECT pid, usename as user, state, now() - query_start as duration,
       wait_event_type, wait_event,
       left(query, 120) as query
     FROM pg_stat_activity
     WHERE state != 'idle' AND query NOT LIKE '%pg_stat_activity%'
     ORDER BY query_start ASC NULLS LAST`)
  if (rows.length === 0) { console.log(theme.success('\n  No active queries.\n')); return }
  const formatted = rows.map((r) => ({
    'PID': String(r.pid), 'User': r.user, 'State': r.state,
    'Duration': String(r.duration).split('.')[0],
    'Wait': r.wait_event ?? theme.muted('-'),
    'Query': r.query?.replace(/\s+/g, ' ').slice(0, 60) ?? '',
  }))
  const { output } = renderTable(['PID', 'User', 'State', 'Duration', 'Wait', 'Query'], formatted, { pageSize: 30 })
  console.log('\n' + divider('Active Queries', W()))
  console.log(output)
}

async function pgConnections(adapter: DbAdapter): Promise<void> {
  const rows = await runQuery(adapter,
    `SELECT state, count(*) as count FROM pg_stat_activity GROUP BY state ORDER BY count DESC`)
  const max = await runQuery(adapter,
    `SELECT setting::int as max FROM pg_settings WHERE name='max_connections'`)
  const total = rows.reduce((s, r) => s + Number(r.count), 0)
  const maxConn = Number(max[0]?.max ?? 100)
  console.log('\n' + divider('Connections', W()))
  for (const r of rows) {
    const pct = (Number(r.count) / maxConn) * 100
    const label = (r.state ?? 'null').padEnd(20)
    console.log(`  ${theme.value(label)} ${String(r.count).padStart(4)}  ${sparkBar(pct, 20)}`)
  }
  console.log(theme.muted(`\n  Total: ${total} / ${maxConn}`))
  if (total / maxConn > 0.8) console.log(theme.warn('  Warning: >80% connection slots used!'))
  console.log()
}

async function pgLocks(adapter: DbAdapter): Promise<void> {
  const rows = await runQuery(adapter,
    `SELECT l.pid, l.relation::regclass as table_name, l.mode, l.granted,
       left(a.query, 80) as query, a.state,
       now() - a.query_start as duration
     FROM pg_locks l JOIN pg_stat_activity a ON l.pid = a.pid
     WHERE l.relation IS NOT NULL AND a.query NOT LIKE '%pg_locks%'
     ORDER BY l.granted, a.query_start`)
  if (rows.length === 0) { console.log(theme.success('\n  No locks held.\n')); return }
  const formatted = rows.map((r) => ({
    'PID': String(r.pid),
    'Table': String(r.table_name),
    'Mode': r.mode,
    'Granted': r.granted ? theme.success('YES') : theme.error('WAITING'),
    'Duration': String(r.duration ?? '').split('.')[0],
    'Query': r.query?.replace(/\s+/g, ' ').slice(0, 50) ?? '',
  }))
  const { output } = renderTable(['PID', 'Table', 'Mode', 'Granted', 'Duration', 'Query'], formatted, { pageSize: 30 })
  console.log('\n' + divider('Locks', W()))
  console.log(output)
  const waiting = rows.filter((r) => !r.granted)
  if (waiting.length > 0) console.log(theme.error(`\n  ${waiting.length} queries WAITING for locks!\n`))
}

async function pgVacuum(adapter: DbAdapter, schema: string): Promise<void> {
  const rows = await runQuery(adapter,
    `SELECT relname as table_name,
       last_vacuum, last_autovacuum, last_analyze, last_autoanalyze,
       vacuum_count, autovacuum_count, n_dead_tup, n_mod_since_analyze
     FROM pg_stat_user_tables WHERE schemaname='${schema}'
     ORDER BY last_autovacuum ASC NULLS FIRST`)
  const formatted = rows.map((r) => {
    const lastVac = r.last_autovacuum ?? r.last_vacuum
    const age = lastVac ? timeSince(new Date(lastVac)) : theme.error('NEVER')
    return {
      'Table': r.table_name,
      'Last vacuum': age,
      'Vacuum #': String(r.vacuum_count + r.autovacuum_count),
      'Dead tuples': String(r.n_dead_tup),
      'Mods since analyze': String(r.n_mod_since_analyze),
    }
  })
  const { output } = renderTable(['Table', 'Last vacuum', 'Vacuum #', 'Dead tuples', 'Mods since analyze'], formatted, { pageSize: 40 })
  console.log('\n' + divider('Vacuum Status', W()))
  console.log(output)
}

async function pgReplication(adapter: DbAdapter): Promise<void> {
  try {
    const rows = await runQuery(adapter,
      `SELECT application_name, client_addr, state, sent_lsn, replay_lsn,
         write_lag, flush_lag, replay_lag
       FROM pg_stat_replication`)
    if (rows.length === 0) { console.log(theme.muted('\n  No replicas connected (or this is not a primary).\n')); return }
    const formatted = rows.map((r) => ({
      'Replica': r.application_name || String(r.client_addr),
      'State': r.state,
      'Write lag': String(r.write_lag ?? '-').split('.')[0],
      'Flush lag': String(r.flush_lag ?? '-').split('.')[0],
      'Replay lag': String(r.replay_lag ?? '-').split('.')[0],
    }))
    const { output } = renderTable(['Replica', 'State', 'Write lag', 'Flush lag', 'Replay lag'], formatted)
    console.log('\n' + divider('Replication', W()))
    console.log(output)
  } catch {
    console.log(theme.muted('\n  Replication info not available.\n'))
  }
}

// ─── MySQL diagnostics ───────────────────────────────────────────────────────

async function mysqlOverview(adapter: DbAdapter): Promise<void> {
  const ver = await runQuery(adapter, `SELECT VERSION() as v, USER() as u, DATABASE() as db`)
  const size = await runQuery(adapter,
    `SELECT round(sum(data_length+index_length)/1024/1024,2) as mb FROM information_schema.tables WHERE table_schema=DATABASE()`)
  const threads = await runQuery(adapter, `SHOW STATUS LIKE 'Threads_connected'`)
  const maxConn = await runQuery(adapter, `SHOW VARIABLES LIKE 'max_connections'`)
  const lines = [
    `${theme.label('Database'.padEnd(16))} ${theme.value(ver[0].db)}`,
    `${theme.label('Version'.padEnd(16))} ${theme.value(ver[0].v)}`,
    `${theme.label('User'.padEnd(16))} ${theme.value(ver[0].u)}`,
    `${theme.label('Size'.padEnd(16))} ${theme.value(`${size[0]?.mb ?? '?'} MB`)}`,
    `${theme.label('Connections'.padEnd(16))} ${theme.value(`${threads[0]?.Value ?? '?'} / ${maxConn[0]?.Value ?? '?'}`)}`,
  ]
  try {
    const bp = await runQuery(adapter,
      `SELECT variable_value FROM performance_schema.global_status WHERE variable_name='Innodb_buffer_pool_read_requests'`)
    const bpReads = await runQuery(adapter,
      `SELECT variable_value FROM performance_schema.global_status WHERE variable_name='Innodb_buffer_pool_reads'`)
    const req = Number(bp[0]?.variable_value ?? 0)
    const reads = Number(bpReads[0]?.variable_value ?? 0)
    if (req > 0) { lines.push(`${theme.label('Buffer pool hit'.padEnd(16))} ${sparkBar(((req - reads) / req) * 100)}`) }
  } catch {}
  console.log(box('Database Overview', lines, W(), theme.primary))
}

async function mysqlTableSizes(adapter: DbAdapter): Promise<void> {
  const rows = await runQuery(adapter,
    `SELECT table_name, data_length, index_length, data_length+index_length as total, table_rows, data_free
     FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE'
     ORDER BY data_length+index_length DESC`)
  if (rows.length === 0) { console.log(theme.muted('\n  No tables.\n')); return }
  const maxSize = Math.max(...rows.map((r) => Number(r.total)), 1)
  const formatted = rows.map((r) => ({
    'Table': r.table_name,
    'Total': fmtBytes(Number(r.total)),
    'Data': fmtBytes(Number(r.data_length)),
    'Indexes': fmtBytes(Number(r.index_length)),
    'Rows': String(r.table_rows ?? '?'),
    'Bar': sparkBar((Number(r.total) / maxSize) * 100, 15),
  }))
  const { output } = renderTable(['Table', 'Total', 'Data', 'Indexes', 'Rows', 'Bar'], formatted, { pageSize: 40 })
  console.log('\n' + divider('Table Sizes', W()))
  console.log(output)
}

async function mysqlBloat(adapter: DbAdapter): Promise<void> {
  const rows = await runQuery(adapter,
    `SELECT table_name, data_free, data_length+index_length+data_free as total,
       round((data_free/nullif(data_length+index_length+data_free,0))*100,2) as bloat_pct
     FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE'
     ORDER BY data_free DESC`)
  const formatted = rows.map((r) => {
    const pct = Number(r.bloat_pct ?? 0)
    return {
      '': pct > 20 ? theme.error('!!') : pct > 5 ? theme.warn('!') : theme.success('OK'),
      'Table': r.table_name,
      'Wasted': fmtBytes(Number(r.data_free)),
      'Bloat %': pct > 0 ? sparkBar(pct, 12) : theme.muted('0%'),
    }
  })
  const { output } = renderTable(['', 'Table', 'Wasted', 'Bloat %'], formatted, { pageSize: 40 })
  console.log('\n' + divider('Table Bloat', W()))
  console.log(output)
}

async function mysqlSlowQueries(adapter: DbAdapter): Promise<void> {
  const rows = await runQuery(adapter,
    `SELECT id, user, host, db, command, time as seconds, state, left(info, 120) as query
     FROM information_schema.processlist WHERE command != 'Sleep' AND info NOT LIKE '%processlist%'
     ORDER BY time DESC`)
  if (rows.length === 0) { console.log(theme.success('\n  No active queries.\n')); return }
  const formatted = rows.map((r) => ({
    'ID': String(r.id), 'User': r.user, 'State': r.state ?? '',
    'Time': `${r.seconds}s`, 'Query': r.query?.replace(/\s+/g, ' ').slice(0, 60) ?? '',
  }))
  const { output } = renderTable(['ID', 'User', 'State', 'Time', 'Query'], formatted, { pageSize: 30 })
  console.log('\n' + divider('Active Queries', W()))
  console.log(output)
}

async function mysqlConnections(adapter: DbAdapter): Promise<void> {
  const rows = await runQuery(adapter,
    `SELECT command, count(*) as count FROM information_schema.processlist GROUP BY command ORDER BY count DESC`)
  const maxConn = await runQuery(adapter, `SHOW VARIABLES LIKE 'max_connections'`)
  const total = rows.reduce((s, r) => s + Number(r.count), 0)
  const maxC = Number(maxConn[0]?.Value ?? 100)
  console.log('\n' + divider('Connections', W()))
  for (const r of rows) {
    console.log(`  ${theme.value(String(r.command).padEnd(20))} ${String(r.count).padStart(4)}  ${sparkBar((Number(r.count) / maxC) * 100, 20)}`)
  }
  console.log(theme.muted(`\n  Total: ${total} / ${maxC}\n`))
}

// ─── SQLite diagnostics ──────────────────────────────────────────────────────

async function sqliteOverview(adapter: DbAdapter): Promise<void> {
  const info = await adapter.getServerInfo()
  const tables = await adapter.getTables()
  let totalRows = 0
  for (const t of tables) {
    try { totalRows += await adapter.getTableRowCount(t.name) } catch {}
  }
  const pageCount = await runQuery(adapter, 'PRAGMA page_count')
  const pageSize = await runQuery(adapter, 'PRAGMA page_size')
  const freeList = await runQuery(adapter, 'PRAGMA freelist_count')
  const pages = Number(pageCount[0]?.page_count ?? 0)
  const pSize = Number(pageSize[0]?.page_size ?? 4096)
  const free = Number(freeList[0]?.freelist_count ?? 0)
  const lines = [
    `${theme.label('File'.padEnd(16))} ${theme.value(info.file ?? '?')}`,
    `${theme.label('Version'.padEnd(16))} ${theme.value(info.version ?? '?')}`,
    `${theme.label('Size'.padEnd(16))} ${theme.value(info.size ?? '?')}`,
    `${theme.label('Tables'.padEnd(16))} ${theme.value(String(tables.length))}`,
    `${theme.label('Total rows'.padEnd(16))} ${theme.value(String(totalRows))}`,
    `${theme.label('Pages'.padEnd(16))} ${theme.value(`${pages} (${fmtBytes(pages * pSize)})`)}`,
    `${theme.label('Free pages'.padEnd(16))} ${theme.value(`${free} (${fmtBytes(free * pSize)})`)}`,
  ]
  if (free > 0 && pages > 0) {
    lines.push(`${theme.label('Fragmentation'.padEnd(16))} ${sparkBar((free / pages) * 100)}`)
  }
  console.log(box('Database Overview', lines, W(), theme.primary))
}

async function sqliteTableSizes(adapter: DbAdapter): Promise<void> {
  const tables = await adapter.getTables()
  const data: Array<{ name: string; rows: number }> = []
  for (const t of tables) {
    try { data.push({ name: t.name, rows: await adapter.getTableRowCount(t.name) }) } catch {}
  }
  data.sort((a, b) => b.rows - a.rows)
  const maxRows = Math.max(...data.map((d) => d.rows), 1)
  const formatted = data.map((d) => ({
    'Table': d.name,
    'Rows': String(d.rows),
    'Bar': sparkBar((d.rows / maxRows) * 100, 20),
  }))
  const { output } = renderTable(['Table', 'Rows', 'Bar'], formatted, { pageSize: 40 })
  console.log('\n' + divider('Table Sizes', W()))
  console.log(output)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// ─── Quick commands (for SQL editor dot commands) ────────────────────────────

export async function quickStats(adapter: DbAdapter, schema: string, dbType: DbType): Promise<void> {
  const spinner = createSpinner(theme.muted('Loading stats...')).start()
  try {
    if (dbType === 'postgresql') await pgOverview(adapter)
    else if (dbType === 'mysql') await mysqlOverview(adapter)
    else await sqliteOverview(adapter)
    spinner.stop()
  } catch (err: any) { spinner.error({ text: theme.error(err.message) }) }
}

export async function quickSlow(adapter: DbAdapter, dbType: DbType): Promise<void> {
  try {
    if (dbType === 'postgresql') await pgSlowQueries(adapter)
    else if (dbType === 'mysql') await mysqlSlowQueries(adapter)
    else console.log(theme.muted('\n  Not available for SQLite.\n'))
  } catch (err: any) { console.log(theme.error(`\n  ${err.message}\n`)) }
}

export async function quickLocks(adapter: DbAdapter, dbType: DbType): Promise<void> {
  try {
    if (dbType === 'postgresql') await pgLocks(adapter)
    else if (dbType === 'mysql') console.log(theme.muted('\n  Use: SELECT * FROM sys.innodb_lock_waits;\n'))
    else console.log(theme.muted('\n  Not available for SQLite.\n'))
  } catch (err: any) { console.log(theme.error(`\n  ${err.message}\n`)) }
}

export async function quickSize(adapter: DbAdapter, schema: string, dbType: DbType): Promise<void> {
  try {
    if (dbType === 'postgresql') await pgTableSizes(adapter, schema)
    else if (dbType === 'mysql') await mysqlTableSizes(adapter)
    else await sqliteTableSizes(adapter)
  } catch (err: any) { console.log(theme.error(`\n  ${err.message}\n`)) }
}

export async function quickBloat(adapter: DbAdapter, schema: string, dbType: DbType): Promise<void> {
  try {
    if (dbType === 'postgresql') await pgBloat(adapter, schema)
    else if (dbType === 'mysql') await mysqlBloat(adapter)
    else {
      const freeList = await runQuery(adapter, 'PRAGMA freelist_count')
      const pageCount = await runQuery(adapter, 'PRAGMA page_count')
      const free = Number(freeList[0]?.freelist_count ?? 0)
      const total = Number(pageCount[0]?.page_count ?? 1)
      console.log(`\n  Free pages: ${free} / ${total} (${((free / total) * 100).toFixed(1)}%)`)
      if (free > 0) console.log(theme.warn('  Run VACUUM to reclaim space.'))
      console.log()
    }
  } catch (err: any) { console.log(theme.error(`\n  ${err.message}\n`)) }
}

// ─── Full diagnostics menu ───────────────────────────────────────────────────

export async function diagnosticsMenu(adapter: DbAdapter, schema: string, dbType: DbType): Promise<void> {
  console.log()
  console.log(divider('Database Diagnostics', W()))

  while (true) {
    const isPg = dbType === 'postgresql'
    const isMysql = dbType === 'mysql'
    const isSqlite = dbType === 'sqlite'

    const choices: any[] = [
      new inquirer.Separator(theme.muted('─── Health ────────────────────────────────────')),
      { name: `${theme.primary('◈')}  ${theme.value('Overview')}             Database summary & cache stats`, value: 'overview' },
      { name: `${theme.primary('◇')}  ${theme.value('Table Sizes')}          Disk usage per table`, value: 'sizes' },
      { name: `${theme.warn('!')}  ${theme.value('Table Bloat')}          Dead tuples & wasted space`, value: 'bloat' },
      { name: `${theme.primary('⚿')}  ${theme.value('Index Usage')}          Used vs unused indexes`, value: 'indexes', disabled: isSqlite ? 'N/A for SQLite' : false },
    ]

    if (!isSqlite) {
      choices.push(
        new inquirer.Separator(theme.muted('─── Activity ──────────────────────────────────')),
        { name: `${theme.accent('▶')}  ${theme.value('Active Queries')}       Currently running queries`, value: 'slow' },
        { name: `${theme.primary('⟳')}  ${theme.value('Connections')}          Connection pool status`, value: 'conns' },
        { name: `${theme.error('⚡')}  ${theme.value('Locks')}                Current locks & blocked queries`, value: 'locks', disabled: isMysql ? 'Use sys schema' : false },
      )
    }

    if (isPg) {
      choices.push(
        new inquirer.Separator(theme.muted('─── Maintenance ───────────────────────────────')),
        { name: `${theme.primary('⟳')}  ${theme.value('Vacuum Status')}        Last vacuum & dead tuple counts`, value: 'vacuum' },
        { name: `${theme.primary('◉')}  ${theme.value('Replication')}          Replica lag & status`, value: 'replication' },
      )
    }

    choices.push(
      new inquirer.Separator(theme.muted('───────────────────────────────────────────────')),
      { name: theme.muted('← Back'), value: 'back' },
    )

    const { action } = await inquirer.prompt([{
      type: 'list', name: 'action', message: 'Select diagnostic:',
      choices, pageSize: 20, loop: false,
    }])

    if (action === 'back') return

    const spinner = createSpinner(theme.muted('Loading...')).start()
    try {
      spinner.stop()
      switch (action) {
        case 'overview':
          if (isPg) await pgOverview(adapter)
          else if (isMysql) await mysqlOverview(adapter)
          else await sqliteOverview(adapter)
          break
        case 'sizes':
          if (isPg) await pgTableSizes(adapter, schema)
          else if (isMysql) await mysqlTableSizes(adapter)
          else await sqliteTableSizes(adapter)
          break
        case 'bloat':
          if (isPg) await pgBloat(adapter, schema)
          else if (isMysql) await mysqlBloat(adapter)
          else await quickBloat(adapter, schema, dbType)
          break
        case 'indexes':
          if (isPg) await pgIndexUsage(adapter, schema)
          break
        case 'slow':
          if (isPg) await pgSlowQueries(adapter)
          else if (isMysql) await mysqlSlowQueries(adapter)
          break
        case 'conns':
          if (isPg) await pgConnections(adapter)
          else if (isMysql) await mysqlConnections(adapter)
          break
        case 'locks': if (isPg) await pgLocks(adapter); break
        case 'vacuum': if (isPg) await pgVacuum(adapter, schema); break
        case 'replication': if (isPg) await pgReplication(adapter); break
      }
    } catch (err: any) {
      spinner.error({ text: theme.error(err.message) })
    }
  }
}
