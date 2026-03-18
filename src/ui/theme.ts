// ─── Tiny hex-to-ANSI256 color helper (replaces chalk) ──────────────────────

type ColorFn = ((s: string) => string) & { bold: (s: string) => string }

function hexToAnsi(h: string): number {
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5)
}

function hex(h: string): ColorFn {
  const c = hexToAnsi(h)
  const fn = ((s: string) => `\x1b[38;5;${c}m${s}\x1b[39m`) as ColorFn
  fn.bold = (s: string) => `\x1b[1;38;5;${c}m${s}\x1b[22;39m`
  return fn
}

// ─── Color Palette ────────────────────────────────────────────────────────────

export const theme = {
  // Brand
  primary:   hex('#7C9CBF'),   // Steel blue
  accent:    hex('#E8A87C'),   // Warm orange
  success:   hex('#6BCB77'),   // Sage green
  error:     hex('#FF6B6B'),   // Soft red
  warn:      hex('#FFD93D'),   // Amber
  muted:     hex('#7A7A8C'),   // Cool grey
  dim:       hex('#4A4A5A'),   // Dimmed
  // Text
  title:     hex('#E8E8F0').bold,
  subtitle:  hex('#B0B0C8'),
  label:     hex('#9A9AB0'),
  value:     hex('#E0E0F0'),
  // Db types
  pg:        hex('#336791').bold,
  mysql:     hex('#00758F').bold,
  sqlite:    hex('#A8B9CC').bold,
  mssql:     hex('#CC2927').bold,
  mongo:     hex('#47A248').bold,
  // Table borders
  border:    hex('#3A3A4A'),
  header:    hex('#7C9CBF').bold,
  // Status
  connected: hex('#6BCB77'),
  disconnected: hex('#FF6B6B'),
  // Syntax highlight
  keyword:   hex('#C586C0').bold,
  string:    hex('#CE9178'),
  number:    hex('#B5CEA8'),
  comment:   hex('#6A9955'),
  fn:        hex('#DCDCAA'),
  type_:     hex('#4EC9B0'),
}

// ─── Boxes & Borders ─────────────────────────────────────────────────────────

const BORDER = {
  tl: '╭', tr: '╮', bl: '╰', br: '╯',
  h: '─', v: '│',
  ml: '├', mr: '┤', mt: '┬', mb: '┴', x: '┼',
  bold: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '═', v: '║' },
}

export function box(title: string, lines: string[], width = 60, color = theme.primary): string {
  const inner = width - 2
  const titleStr = ` ${title} `
  const topFill = BORDER.h.repeat(Math.max(0, inner - titleStr.length - 1))
  const top = color(`${BORDER.tl}${BORDER.h}${titleStr}${topFill}${BORDER.tr}`)
  const bottom = color(`${BORDER.bl}${BORDER.h.repeat(inner)}${BORDER.br}`)
  const body = lines.map(line => {
    const plain = stripAnsi(line)
    const pad = Math.max(0, inner - plain.length - 2)
    return color(BORDER.v) + ` ${line}${' '.repeat(pad)} ` + color(BORDER.v)
  })
  return [top, ...body, bottom].join('\n')
}

export function divider(label?: string, width = 60, color = theme.muted): string {
  if (label) {
    const mid = ` ${label} `
    const half = Math.floor((width - mid.length) / 2)
    return color(`${'─'.repeat(half)}${mid}${'─'.repeat(width - half - mid.length)}`)
  }
  return color('─'.repeat(width))
}

export function badge(text: string, color: (s: string) => string): string {
  return color(` ${text} `)
}

// ─── Simple ANSI strip ───────────────────────────────────────────────────────

export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
}

export function padEnd(str: string, len: number): string {
  const plain = stripAnsi(str)
  return str + ' '.repeat(Math.max(0, len - plain.length))
}

// ─── SQL Syntax Highlighter ──────────────────────────────────────────────────

const SQL_KEYWORDS = new Set([
  'SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET',
  'DELETE','CREATE','DROP','ALTER','TABLE','INDEX','VIEW','DATABASE',
  'SCHEMA','JOIN','LEFT','RIGHT','INNER','OUTER','FULL','ON','AS',
  'AND','OR','NOT','IN','IS','NULL','LIKE','BETWEEN','GROUP','BY',
  'ORDER','HAVING','LIMIT','OFFSET','DISTINCT','COUNT','SUM','AVG',
  'MIN','MAX','UNION','ALL','WITH','CASE','WHEN','THEN','ELSE','END',
  'RETURNING','CASCADE','CONSTRAINT','PRIMARY','KEY','FOREIGN','REFERENCES',
  'EXPLAIN','ANALYZE','VERBOSE','BEGIN','COMMIT','ROLLBACK','TRANSACTION',
])

export function highlightSQL(sql: string): string {
  return sql.replace(/('(?:''|[^'])*')/g, (m) => theme.string(m))
            .replace(/\b(\d+(?:\.\d+)?)\b/g, (m) => theme.number(m))
            .replace(/--[^\n]*/g, (m) => theme.comment(m))
            .replace(/\/\*[\s\S]*?\*\//g, (m) => theme.comment(m))
            .replace(/\b([A-Z_][A-Z0-9_]*)\b/gi, (word) =>
              SQL_KEYWORDS.has(word.toUpperCase()) ? theme.keyword(word) : word
            )
}

// ─── Table renderer ──────────────────────────────────────────────────────────

export function renderTable(
  columns: string[],
  rows: Record<string, any>[],
  opts: { maxWidth?: number; maxRows?: number; page?: number; pageSize?: number } = {}
): { output: string; totalRows: number; displayedRows: number; pageCount: number } {
  const { maxWidth = process.stdout.columns ?? 120, pageSize = 50, page = 0 } = opts

  const startRow = page * pageSize
  const pageRows = rows.slice(startRow, startRow + pageSize)
  const totalRows = rows.length
  const pageCount = Math.ceil(totalRows / pageSize)

  if (columns.length === 0) return { output: theme.muted('  (no results)'), totalRows, displayedRows: 0, pageCount }

  const colWidths = columns.map((col) => {
    const headerLen = col.length
    const maxData = pageRows.reduce((max, row) => {
      const val = formatCell(row[col])
      return Math.max(max, val.length)
    }, 0)
    return Math.min(Math.max(headerLen, maxData), 40)
  })

  const totalW = colWidths.reduce((a, b) => a + b + 3, 1)
  if (totalW > maxWidth) {
    const budget = maxWidth - columns.length * 3 - 1
    const share = Math.floor(budget / columns.length)
    colWidths.fill(Math.max(4, share))
  }

  const sep = (l: string, m: string, r: string, f: string) =>
    theme.border(l + colWidths.map(w => f.repeat(w + 2)).join(m) + r)

  const topSep = sep('╭', '┬', '╮', '─')
  const midSep = sep('├', '┼', '┤', '─')
  const botSep = sep('╰', '┴', '╯', '─')

  const headerCells = columns.map((col, i) =>
    theme.header(padEnd(col, colWidths[i]))
  )
  const headerRow = theme.border('│') + headerCells.map(c => ` ${c} `).join(theme.border('│')) + theme.border('│')

  const rowBg = (s: string) => `\x1b[48;5;235m${s}\x1b[49m`  // subtle dark bg for alternating rows
  const dataRows = pageRows.map((row, ri) => {
    const cells = columns.map((col, i) => {
      const val = truncate(formatCell(row[col]), colWidths[i])
      const colored = colorizeCell(row[col], val)
      return ` ${padEnd(colored, colWidths[i])} `
    })
    const line = theme.border('│') + cells.join(theme.border('│')) + theme.border('│')
    return ri % 2 === 1 ? rowBg(line) : line
  })

  const lines = [topSep, headerRow, midSep, ...dataRows, botSep]

  const footer = `  ${theme.muted(`Rows ${startRow + 1}–${Math.min(startRow + pageSize, totalRows)} of ${totalRows}`)}` +
    (pageCount > 1 ? theme.muted(` · Page ${page + 1}/${pageCount} · ↑↓ scroll · ← → pages`) : '')

  return {
    output: lines.join('\n') + '\n' + footer,
    totalRows,
    displayedRows: pageRows.length,
    pageCount,
  }
}

function formatCell(val: any): string {
  if (val === null || val === undefined) return 'NULL'
  if (val instanceof Date) return val.toISOString()
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function colorizeCell(raw: any, formatted: string): string {
  if (raw === null || raw === undefined) return theme.muted(formatted)
  if (typeof raw === 'number') return theme.number(formatted)
  if (typeof raw === 'boolean') return raw ? theme.success(formatted) : theme.error(formatted)
  return formatted
}

function truncate(str: string, maxLen: number): string {
  const plain = stripAnsi(str)
  if (plain.length <= maxLen) return str
  return plain.slice(0, maxLen - 1) + '…'
}

// ─── Status bar ──────────────────────────────────────────────────────────────

export function statusBar(parts: Array<{ label: string; value: string; color?: (s: string) => string }>): string {
  return parts.map(p => {
    const col = p.color ?? theme.muted
    return `${theme.dim(p.label + ':')} ${col(p.value)}`
  }).join(theme.dim('  ·  '))
}

// ─── Loading spinner states ───────────────────────────────────────────────────

export const SPINNER_FRAMES = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']

export function logo(): string {
  return [
    theme.primary.bold('  ██████╗ ██████╗ ████████╗███████╗██████╗ ███╗   ███╗'),
    theme.primary.bold('  ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔══██╗████╗ ████║'),
    theme.accent.bold( '  ██║  ██║██████╔╝   ██║   █████╗  ██████╔╝██╔████╔██║'),
    theme.accent.bold( '  ██║  ██║██╔══██╗   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║'),
    theme.muted.bold(  '  ██████╔╝██████╔╝   ██║   ███████╗██║  ██║██║ ╚═╝ ██║'),
    theme.muted(       '  ╚═════╝ ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝'),
    '',
    theme.muted('  The terminal database client · Inspired by IntelliJ IDEA'),
  ].join('\n')
}
