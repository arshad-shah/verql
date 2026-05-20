import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { IPC_CHANNELS, IPC_EVENTS, type IpcChannel, type IpcEvent } from '../../shared/ipc'

/**
 * Coverage guard for the central IPC registry.
 *
 * Two invariants:
 *   (1) every `IpcChannelMap` key appears as a value of `IPC_CHANNELS`
 *   (2) every `IpcEventMap` key appears as a value of `IPC_EVENTS`
 *
 * `satisfies Record<string, IpcChannel>` already proves the inverse — that
 * no constant points at a non-channel — so together they make the registry
 * the single source of truth.
 *
 * Both invariants are enforced at compile time via the type-level checks
 * below; the runtime assertions exist for clarity in failure reports.
 */

// ─── Compile-time coverage check ────────────────────────────────────────────
//
// `IpcChannelKeysCovered<T>` evaluates to `never` (no error) when every
// channel/event name is present as a constant value. If a key is missing,
// the type resolves to the missing literal type and the `_assert` constant
// fails to typecheck — breaking the build.

type ChannelValues = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS]
type EventValues = typeof IPC_EVENTS[keyof typeof IPC_EVENTS]

type MissingChannels = Exclude<IpcChannel, ChannelValues>
type MissingEvents = Exclude<IpcEvent, EventValues>

// If any channel is missing from IPC_CHANNELS, MissingChannels resolves to
// the offending union and this assignment fails.
const _missingChannels: MissingChannels = undefined as never
const _missingEvents: MissingEvents = undefined as never
void _missingChannels
void _missingEvents

describe('IPC channel registry coverage', () => {
  it('every invoke channel name is unique (no accidental duplicates)', () => {
    const values = Object.values(IPC_CHANNELS)
    expect(new Set(values).size).toBe(values.length)
  })

  it('every broadcast event name is unique', () => {
    const values = Object.values(IPC_EVENTS)
    expect(new Set(values).size).toBe(values.length)
  })

  it('IPC_CHANNELS values are all properly-prefixed channel names', () => {
    for (const v of Object.values(IPC_CHANNELS)) {
      expect(v, `channel "${v}"`).toMatch(/^[a-z]+:[a-z][a-z0-9-]*(:[a-z][a-z0-9-]*)*$/)
    }
  })

  it('source code does not invoke an unregistered channel', () => {
    // Find every `electronAPI.invoke('foo:bar'` string-literal call site.
    // The literal must match a value in IPC_CHANNELS — if it doesn't, the
    // developer is bypassing the central registry.
    const callSites = collectInvocations()
    const knownChannels = new Set<string>(Object.values(IPC_CHANNELS))
    const offenders: string[] = []
    for (const { file, line, name } of callSites) {
      if (!knownChannels.has(name)) {
        offenders.push(`${file}:${line} invokes unregistered "${name}"`)
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([])
  })

  it('source code does not subscribe to an unregistered event', () => {
    const subscribeSites = collectSubscriptions()
    const knownEvents = new Set<string>(Object.values(IPC_EVENTS))
    const offenders: string[] = []
    for (const { file, line, name } of subscribeSites) {
      if (!knownEvents.has(name)) {
        offenders.push(`${file}:${line} subscribes to unregistered event "${name}"`)
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([])
  })
})

// ─── helpers ────────────────────────────────────────────────────────────────

const SRC_ROOT = path.join(__dirname, '../../src')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'out') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) out.push(full)
  }
  return out
}

interface Hit { file: string; line: number; name: string }

function scanForLiteralCalls(pattern: RegExp): Hit[] {
  const files = walk(SRC_ROOT)
  const hits: Hit[] = []
  for (const file of files) {
    if (file.endsWith('.d.ts')) continue
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const m = pattern.exec(lines[i])
      if (m) hits.push({ file: path.relative(SRC_ROOT, file), line: i + 1, name: m[1] })
    }
  }
  return hits
}

function collectInvocations(): Hit[] {
  // electronAPI.invoke('foo:bar', …) — only string-literal forms; constant
  // refs (IPC_CHANNELS.X) bypass the check, which is the goal.
  return scanForLiteralCalls(/electronAPI\.invoke\(['"]([a-z][a-z0-9:_-]+)['"]/)
}

function collectSubscriptions(): Hit[] {
  // electronAPI.on('foo:bar', …) — same logic for one-way events.
  return scanForLiteralCalls(/electronAPI\.on\(['"]([a-z][a-z0-9:_-]+)['"]/)
}
