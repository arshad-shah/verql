// Render the Homebrew tap files (macOS cask + Linux formula) for a release.
//
// Single source of truth: the templates in packaging/homebrew/*.tmpl, filled
// with the release version + sha256s and written WHOLE. The tap file is a pure
// build artifact — we never do in-place surgery on the live cask. The templates
// build their download URLs with Ruby `#{version}` interpolation against
// electron-builder's lowercase artifact names, so the only values we inject are
// the version and the three checksums.
//
// Used by .github/workflows/homebrew-bump.yml (on release:published). The pure
// `render()` core is unit-tested in tests/unit/render-homebrew.test.ts.
//
// CLI:
//   node scripts/render-homebrew.mjs \
//     --version 1.4.0 \
//     --sha-arm64 <sha> --sha-x64 <sha> --sha-appimage <sha> \
//     --tap-dir ./tap
//
// Writes <tap-dir>/Casks/verql.rb and <tap-dir>/Formula/verql.rb.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const TEMPLATES = resolve(HERE, '..', 'packaging', 'homebrew')

/**
 * Fill `{{KEY}}` placeholders from `vars`. Fail-closed: any placeholder left
 * unresolved (typo, missing var, or a value that itself contains `{{…}}`)
 * throws rather than shipping a broken tap file. Single pass over the template,
 * so a value is never re-expanded.
 */
export function render(template, vars) {
  const filled = template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
  )
  const leftover = filled.match(/\{\{[A-Z0-9_]+\}\}/)
  if (leftover) {
    throw new Error(`unresolved placeholder ${leftover[0]} after rendering template`)
  }
  return filled
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a.startsWith('--')) {
      out[a.slice(2)] = argv[i + 1]
      i += 1
    }
  }
  return out
}

function main() {
  const a = parseArgs(process.argv.slice(2))
  const required = ['version', 'sha-arm64', 'sha-x64', 'sha-appimage', 'tap-dir']
  const missing = required.filter((k) => !a[k])
  if (missing.length) {
    console.error(`render-homebrew: missing required arg(s): ${missing.map((m) => `--${m}`).join(' ')}`)
    process.exit(1)
  }

  const vars = {
    VERSION: a.version,
    SHA_ARM64: a['sha-arm64'],
    SHA_X64: a['sha-x64'],
    SHA_APPIMAGE: a['sha-appimage'],
  }

  const targets = [
    { tmpl: 'verql.cask.rb.tmpl', out: join(a['tap-dir'], 'Casks', 'verql.rb') },
    { tmpl: 'verql.formula.rb.tmpl', out: join(a['tap-dir'], 'Formula', 'verql.rb') },
  ]

  for (const t of targets) {
    const template = readFileSync(join(TEMPLATES, t.tmpl), 'utf-8')
    const rendered = render(template, vars)
    mkdirSync(dirname(t.out), { recursive: true })
    writeFileSync(t.out, rendered)
    console.log(`wrote ${t.out}`)
  }
}

// Run the CLI only when invoked directly (not when imported by the test).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
