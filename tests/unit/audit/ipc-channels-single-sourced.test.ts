import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

/**
 * Architectural guard: every IPC channel/event must be referenced through the
 * central `IPC_CHANNELS` / `IPC_EVENTS` constants (single-sourced in
 * `shared/ipc.ts`), never by re-typing its raw wire string at a call site.
 *
 * The wire string is type-checked against `IpcChannelMap`, so a typo won't
 * compile — but a raw literal still duplicates the string that lives once in
 * `IPC_CHANNELS`, and lets the renderer/main drift. This test fails the moment a
 * raw `'domain:action'` literal appears as the channel argument of an IPC call
 * (`invoke` / `on` / `send` / `handle` / `h` / `broadcast` / `emit`), so the
 * regression we cleaned up can never creep back. See docs/ipc.md.
 */

const ROOTS = ['src/main', 'src/renderer/src', 'src/preload', 'shared']
// shared/ipc.ts and ipc-events.ts are where the wire strings are DEFINED.
const ALLOWED_FILES = new Set(['shared/ipc.ts'])
const IPC_METHODS = ['invoke', 'on', 'send', 'handle', 'h', 'broadcast', 'emit']

// Matches an IPC method call whose first argument is a raw `'domain:action'`
// (or `domain:sub:action`) string literal — i.e. the channel/event written by
// hand instead of via IPC_CHANNELS.X / IPC_EVENTS.X.
const VIOLATION = new RegExp(
  String.raw`\b(${IPC_METHODS.join('|')})\(\s*(['"])([a-z][a-z0-9_-]*(?::[a-z0-9_-]+)+)\2`,
  'g',
)

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walk(full))
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|stories)\.(ts|tsx)$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

function findViolations(): string[] {
  const repoRoot = path.resolve(__dirname, '../..')
  const hits: string[] = []
  for (const root of ROOTS) {
    const abs = path.join(repoRoot, root)
    if (!fs.existsSync(abs)) continue
    for (const file of walk(abs)) {
      const rel = path.relative(repoRoot, file).replace(/\\/g, '/')
      if (ALLOWED_FILES.has(rel)) continue
      const src = fs.readFileSync(file, 'utf-8')
      const lines = src.split('\n')
      lines.forEach((line, i) => {
        VIOLATION.lastIndex = 0
        let m: RegExpExecArray | null
        while ((m = VIOLATION.exec(line))) {
          hits.push(`${rel}:${i + 1}  ${m[1]}('${m[3]}', …)  → use IPC_CHANNELS/IPC_EVENTS`)
        }
      })
    }
  }
  return hits
}

describe('IPC channels are single-sourced through IPC_CHANNELS / IPC_EVENTS', () => {
  it('has no raw wire-string literals at IPC call sites', () => {
    const violations = findViolations()
    expect(violations, `\nRaw IPC string literals found — replace with the constant from @shared/ipc:\n${violations.join('\n')}\n`).toEqual([])
  })

  // Guard the guard: the regex must actually catch the shape it claims to.
  it('detects a raw literal (regex sanity)', () => {
    VIOLATION.lastIndex = 0
    expect(VIOLATION.test(`handle('db:query', fn)`)).toBe(true)
    VIOLATION.lastIndex = 0
    expect(VIOLATION.test(`window.electronAPI.invoke('settings:set', k, v)`)).toBe(true)
    VIOLATION.lastIndex = 0
    expect(VIOLATION.test(`deps.broadcast('ai:chat:event', id, e)`)).toBe(true)
    // The compliant form must NOT match.
    VIOLATION.lastIndex = 0
    expect(VIOLATION.test(`handle(IPC_CHANNELS.DB_QUERY, fn)`)).toBe(false)
  })
})
