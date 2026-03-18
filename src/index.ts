#!/usr/bin/env node

import { manageConnections } from './commands/connections.js'
import { startSession } from './commands/session.js'
import { theme, logo } from './ui/theme.js'
import { getConnections, getConnection } from './config/store.js'
import type { Connection } from './config/store.js'
import { createAdapter } from './db/adapter.js'
import { printError } from './utils/errors.js'

const VERSION = '1.0.0'

// ─── REL-2: Global unhandled rejection / exception handlers ─────────────────

process.on('unhandledRejection', (reason) => {
  printError(reason, 'Unhandled promise rejection')
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  printError(err, 'Uncaught exception')
  process.exit(1)
})

async function main() {
  const args = process.argv.slice(2)

  // POL-3: Check Node.js version
  const nodeVersion = parseInt(process.versions.node.split('.')[0], 10)
  if (nodeVersion < 18) {
    console.log(theme.error(`\n  dbterm requires Node.js 18 or later. You have v${process.versions.node}.`))
    console.log(theme.muted(`  Download: https://nodejs.org\n`))
    process.exit(1)
  }

  // Handle quick connection by name/id: dbterm connect "My DB"
  if (args[0] === 'connect' && args[1]) {
    const query = args[1]
    const connections = getConnections()
    const conn = connections.find(c =>
      c.name.toLowerCase() === query.toLowerCase() || c.id === query
    )
    if (conn) {
      await startSession(conn)
      return
    } else {
      console.log(theme.error(`\n  Connection "${query}" not found.\n`))
      console.log(theme.muted(`  Available connections: ${connections.map(c => c.name).join(', ')}\n`))
      process.exit(1)
    }
  }

  // REL-3: dbterm exec <connection-name> <sql> — non-interactive mode
  if (args[0] === 'exec') {
    if (!args[1] || !args[2]) {
      console.error('Usage: dbterm exec <connection-name> "<sql>"')
      process.exit(1)
    }
    const connName = args[1]
    const sql = args[2]
    const connections = getConnections()
    const conn = connections.find(c =>
      c.name.toLowerCase() === connName.toLowerCase() || c.id === connName
    )
    if (!conn) {
      console.error(`Connection "${connName}" not found.`)
      process.exit(1)
    }
    const adapter = await createAdapter(conn)
    await adapter.connect()
    const result = await adapter.query(sql)
    await adapter.disconnect()
    if (result.error) {
      console.error(result.error)
      process.exit(1)
    }
    if (result.columns.length > 0 && result.rows.length > 0) {
      // Output as CSV to stdout
      console.log(result.columns.join(','))
      for (const row of result.rows) {
        const vals = result.columns.map(c => {
          const v = row[c]
          if (v === null || v === undefined) return ''
          const s = String(v)
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"` : s
        })
        console.log(vals.join(','))
      }
    } else if (result.affectedRows !== undefined) {
      console.log(`${result.affectedRows} row(s) affected`)
    }
    return
  }

  // Handle list command
  if (args[0] === 'list') {
    const connections = getConnections()
    if (connections.length === 0) {
      console.log(theme.muted('\n  No saved connections. Run dbterm to add one.\n'))
    } else {
      console.log()
      connections.forEach(c => {
        const host = c.type === 'sqlite' ? (c.file ?? c.database) : `${c.host}:${c.port}/${c.database}`
        console.log(`  ${theme.accent(c.name.padEnd(24))} ${theme.muted(c.type.padEnd(12))} ${theme.label(host)}`)
      })
      console.log()
    }
    return
  }

  // Handle version
  if (args[0] === '--version' || args[0] === '-v') {
    console.log(`dbterm v${VERSION} (node ${process.version}, ${process.platform})`)
    return
  }

  // Handle help
  if (args[0] === '--help' || args[0] === '-h') {
    printHelp()
    return
  }

  // REL-3: Check if stdin is a TTY for interactive mode
  if (!process.stdin.isTTY) {
    console.error('dbterm requires an interactive terminal (TTY).')
    console.error('For scripted use, pipe SQL directly:  dbterm exec "My DB" "SELECT 1"')
    process.exit(1)
  }

  // Default: show connection manager
  process.on('SIGINT', () => {
    console.log(theme.muted('\n\n  Bye!\n'))
    process.exit(0)
  })

  const conn = await manageConnections()
  if (conn) {
    await startSession(conn)
  }
}

function printHelp() {
  console.log(logo())
  console.log()
  const lines = [
    `${theme.value('dbterm')}                          Open connection manager`,
    `${theme.value('dbterm list')}                     List saved connections`,
    `${theme.value('dbterm connect <name>')}           Connect to a saved connection by name`,
    `${theme.value('dbterm exec <name> "<sql>"')}      Execute SQL non-interactively (CSV output)`,
    `${theme.value('dbterm --version')}                Show version`,
    `${theme.value('dbterm --help')}                   Show this help`,
    '',
    `${theme.muted('Config stored at:')} ${theme.label('~/.config/dbterm')}`,
    '',
    `${theme.muted('Supported databases:')}`,
    `  ${theme.pg('PostgreSQL')}  ${theme.mysql('MySQL/MariaDB')}  ${theme.sqlite('SQLite')}`,
    `  ${theme.mssql('SQL Server')}  ${theme.mongo('MongoDB')} (coming soon)`,
  ]
  lines.forEach(l => console.log('  ' + l))
  console.log()
}

main().catch((err) => {
  printError(err, 'Fatal error')
  process.exit(1)
})
