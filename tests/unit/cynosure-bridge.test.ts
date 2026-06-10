import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Contract for the Cynosure theme bridge (`styles/cynosure-bridge.css`).
 *
 * Cynosure components are styled exclusively through `--cynosure-*` semantic
 * CSS variables. Verql themes (bundled + plugin) define `--color-*` semantic
 * variables under `[data-theme="<id>"]`. The bridge aliases every semantic
 * Cynosure token to the corresponding Verql token so that *any* Verql theme —
 * including third-party plugin themes — themes Cynosure components with zero
 * per-theme work.
 *
 * These tests fail when a Cynosure upgrade introduces a semantic token the
 * bridge doesn't cover (which would leak Cynosure's default light palette
 * into dark themes), keeping the bridge honest over time.
 */

const ROOT = resolve(__dirname, '../..')

const baseCss = readFileSync(
  resolve(ROOT, 'node_modules/@arshad-shah/cynosure-tokens/dist/css/base.css'),
  'utf8',
)
const componentCss = readFileSync(
  resolve(ROOT, 'node_modules/@arshad-shah/cynosure-react/dist/styles.css'),
  'utf8',
)
const bridgeCss = readFileSync(
  resolve(ROOT, 'src/renderer/src/styles/cynosure-bridge.css'),
  'utf8',
)

/** Semantic (theme-dependent) colour groups — everything a theme remaps. */
const SEMANTIC_COLOR = /--cynosure-color-(?:background|foreground|border|accent|feedback)[a-z0-9-]*/g

function declaredVars(css: string): Set<string> {
  // A declaration is `--token-name:`; a mere `var(--token-name)` reference is not.
  const out = new Set<string>()
  for (const m of css.matchAll(/(--cynosure-[a-z0-9-]+)\s*:/g)) out.add(m[1])
  return out
}

describe('cynosure-bridge.css', () => {
  const bridgeDeclared = declaredVars(bridgeCss)

  it('re-declares every semantic colour token the token package defines', () => {
    const semantic = new Set(baseCss.match(SEMANTIC_COLOR) ?? [])
    expect(semantic.size).toBeGreaterThanOrEqual(46) // sanity: 3.x ships 46
    const missing = [...semantic].filter((v) => !bridgeDeclared.has(v))
    expect(missing).toEqual([])
  })

  it('covers every semantic colour token component styles actually consume', () => {
    const consumed = new Set(
      [...componentCss.matchAll(/var\((--cynosure-color-(?:background|foreground|border|accent|feedback)[a-z0-9-]*)/g)].map(
        (m) => m[1],
      ),
    )
    const missing = [...consumed].filter((v) => !bridgeDeclared.has(v))
    expect(missing).toEqual([])
  })

  it('bridges the font family tokens to the app font stacks', () => {
    expect(bridgeDeclared.has('--cynosure-font-family-sans')).toBe(true)
    expect(bridgeDeclared.has('--cynosure-font-family-mono')).toBe(true)
  })

  it('only references Verql theme tokens (or self-contained literals) in its values', () => {
    // Guard against accidentally re-introducing Cynosure scale colours
    // (gray/iris/…): those don't follow the active Verql theme.
    const scaleRefs = bridgeCss.match(
      /var\(--cynosure-color-(?:gray|iris|red|green|blue|amber|violet)-\d+\)/g,
    )
    expect(scaleRefs).toBeNull()
  })

  it('declares the bridge with specificity that beats the packaged dark-theme override', () => {
    // The token package ships `[data-theme='dark'] { … }` overrides. Verql has
    // a theme whose id is literally `dark`, so the bridge must win that tie —
    // it scopes to `:root, :root[data-theme]` (0,2,0 ≥ 0,1,0).
    expect(bridgeCss).toMatch(/:root\s*,\s*:root\[data-theme\]/)
  })
})
