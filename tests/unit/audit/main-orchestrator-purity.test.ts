// Architecture test — pins the rule "the main app is a pure orchestrator".
//
// Anything under src/main/ that is NOT inside src/main/plugins/ must not
// contain driver-specific code (PostgreSQL, MySQL, SQLite, MongoDB, Redis,
// Snowflake). Generic SQL helpers belong in the plugin SDK (where drivers
// can also import them); dialect strings belong inside the relevant
// driver plugin. The bundled-themes plugin is the documented exception
// because themes have to load before any driver to avoid a flash of
// unstyled content, but themes don't speak any database dialect anyway.
//
// Allowed forms:
//   - Generic SDK code parameterised by `quoteChar`, `placeholder`, etc.
//   - The bundled-plugin wiring file that lists every plugin module.
//
// Disallowed forms (regression triggers):
//   - String literals 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' |
//     'mongo' | 'redis' | 'snowflake' | 'postgres' in main code outside
//     plugins/.
//   - Imports from ../plugins/bundled/<driver>/ in non-wiring files.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const MAIN_ROOT = path.join(__dirname, '..', '..', '..', 'src', 'main')
const PLUGINS_DIR = path.join(MAIN_ROOT, 'plugins')

// The single wiring file that's allowed to mention bundled drivers by name,
// because that's exactly its job: import every bundled plugin and hand it
// to the boot coordinator. Everything else must stay driver-agnostic.
const WIRING_EXCEPTIONS = new Set<string>([
  path.join(MAIN_ROOT, 'plugins', 'bundled', 'index.ts'),
])

const FORBIDDEN_LITERALS = [
  /(["'`])postgresql\1/,
  /(["'`])postgres\1/,
  /(["'`])mysql\1/,
  /(["'`])sqlite\1/,
  /(["'`])mongodb\1/,
  /(["'`])mongo\1/,
  /(["'`])redis\1/,
  /(["'`])snowflake\1/,
]

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      // Plugin code is by definition driver-specific — skip the whole
      // plugins/ subtree. Driver-specific knowledge is allowed inside an
      // individual plugin folder.
      if (p === PLUGINS_DIR) continue
      walk(p, out)
    } else if (entry.isFile() && (p.endsWith('.ts') || p.endsWith('.tsx'))) {
      out.push(p)
    }
  }
  return out
}

function stripComments(source: string): string {
  // Crude strip: block comments first, then line comments. We're scanning for
  // forbidden tokens in code, not in documentation — a comment mentioning
  // "postgresql" is fine.
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

describe('architecture — main orchestrator stays driver-agnostic', () => {
  const files = walk(MAIN_ROOT).filter(f => !WIRING_EXCEPTIONS.has(f))

  it('finds at least a few files (sanity)', () => {
    expect(files.length).toBeGreaterThan(5)
  })

  it.each(files)('%s contains no driver-specific string literal', (file) => {
    const source = stripComments(fs.readFileSync(file, 'utf-8'))
    const offenders: string[] = []
    for (const re of FORBIDDEN_LITERALS) {
      const m = source.match(re)
      if (m) offenders.push(m[0])
    }
    expect(offenders, `Driver-specific literals must live inside a plugin: ${offenders.join(', ')}`)
      .toEqual([])
  })

  it.each(files)('%s does not import from a bundled-driver folder', (file) => {
    const source = stripComments(fs.readFileSync(file, 'utf-8'))
    const m = source.match(/from\s+['"][^'"]*plugins\/bundled\/(postgresql|mysql|sqlite|mongodb|redis|snowflake|ssh-tunnel|ai|core-formats|core-themes)[^'"]*['"]/)
    expect(m?.[0], `Direct imports from a bundled plugin belong only in the wiring file: ${m?.[0]}`)
      .toBeUndefined()
  })
})
