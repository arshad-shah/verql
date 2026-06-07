import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { IPC_CHANNELS, IPC_EVENTS, type IpcChannelShapes, type IpcEventShapes, type IpcChannelMap, type IpcEventMap } from '../../shared/ipc'

/**
 * Coverage guard for the central IPC registry.
 *
 * The wire string of every channel/event now lives in exactly one place — the
 * value in `IPC_CHANNELS` / `IPC_EVENTS` — while the `args`/`return` (or event
 * payload) contract lives in `IpcChannelShapes` / `IpcEventShapes`, keyed by
 * the same CONSTANT NAME. The single invariant that keeps the two halves from
 * drifting is therefore:
 *
 *   the key set of `IPC_CHANNELS` === the key set of `IpcChannelShapes`
 *   the key set of `IPC_EVENTS`   === the key set of `IpcEventShapes`
 *
 * This is already enforced at the definition site by the
 * `satisfies Record<keyof IpcChannelShapes, string>` clause, but we re-assert
 * it here at compile time so a regression produces a clear, located failure,
 * and keep the runtime call-site scan that bans inline string literals.
 */

// ─── Compile-time coverage check ────────────────────────────────────────────
//
// Each `Missing*` type resolves to `never` when the constant registry and its
// shape interface share an identical key set. If they diverge, it resolves to
// the offending constant-name union and the `as never` assignment fails to
// typecheck — breaking the build with the missing name in the error.

type MissingChannelShapes = Exclude<keyof typeof IPC_CHANNELS, keyof IpcChannelShapes>
type OrphanChannelShapes = Exclude<keyof IpcChannelShapes, keyof typeof IPC_CHANNELS>
type MissingEventShapes = Exclude<keyof typeof IPC_EVENTS, keyof IpcEventShapes>
type OrphanEventShapes = Exclude<keyof IpcEventShapes, keyof typeof IPC_EVENTS>

const _missingChannelShapes: MissingChannelShapes = undefined as never
const _orphanChannelShapes: OrphanChannelShapes = undefined as never
const _missingEventShapes: MissingEventShapes = undefined as never
const _orphanEventShapes: OrphanEventShapes = undefined as never
void _missingChannelShapes
void _orphanChannelShapes
void _missingEventShapes
void _orphanEventShapes

// ─── Derivation check ───────────────────────────────────────────────────────
//
// The wire-string-keyed maps consumed by invoke/handle/preload are *derived*
// from the constant-name-keyed shapes. Pin that the join is correct: the shape
// reached via a wire string must equal the shape authored under its constant
// name. `AssertEqual` resolves to `never` on a mismatch, failing the build.

type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never

const _channelDerivation: AssertEqual<
  IpcChannelMap[typeof IPC_CHANNELS.DB_CONNECT],
  IpcChannelShapes['DB_CONNECT']
> = true
const _eventDerivation: AssertEqual<
  IpcEventMap[typeof IPC_EVENTS.AI_CHAT_EVENT],
  IpcEventShapes['AI_CHAT_EVENT']
> = true
void _channelDerivation
void _eventDerivation

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
