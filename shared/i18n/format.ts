// Tiny ICU-subset message formatter — framework-free so both Electron processes
// can use it. Supports:
//   • named placeholders:  "Connected to {name}"
//   • minimal plurals:     "{count, plural, one {# row} other {# rows}}"
//     with optional exact matches ("=0 {no rows}"); "#" renders the count.
// English plural rules only for now; a locale can extend `pluralCategory`.
// Deliberately not a full ICU engine — the app's needs are simple and a small,
// dependency-free implementation keeps the desktop bundle lean.

export type TranslationVars = Record<string, string | number>

/** Index of the `}` matching the `{` at `open`, or -1 if unbalanced. */
function matchBrace(s: string, open: number): number {
  let depth = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') depth++
    else if (s[i] === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** English plural category for a count. */
function pluralCategory(count: number): 'one' | 'other' {
  return count === 1 ? 'one' : 'other'
}

/** Parse `one {…} other {…}` option bodies (bodies may contain nested braces). */
function parsePluralOptions(body: string): Record<string, string> {
  const opts: Record<string, string> = {}
  let i = 0
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i])) i++
    const brace = body.indexOf('{', i)
    if (brace === -1) break
    const key = body.slice(i, brace).trim()
    const end = matchBrace(body, brace)
    if (end === -1) break
    if (key) opts[key] = body.slice(brace + 1, end)
    i = end + 1
  }
  return opts
}

/** Replace plural constructs with the option chosen for the bound count. */
function resolvePlurals(template: string, vars: TranslationVars): string {
  let result = ''
  let i = 0
  while (i < template.length) {
    const start = template.indexOf('{', i)
    if (start === -1) {
      result += template.slice(i)
      break
    }
    result += template.slice(i, start)
    const end = matchBrace(template, start)
    if (end === -1) {
      // Unbalanced — emit the rest verbatim and stop.
      result += template.slice(start)
      break
    }
    const inner = template.slice(start + 1, end)
    const m = /^(\w+),\s*plural,\s*([\s\S]*)$/.exec(inner)
    if (m) {
      const [, name, body] = m
      const count = Number(vars[name] ?? 0)
      const options = parsePluralOptions(body)
      const chosen = options[`=${count}`] ?? options[pluralCategory(count)] ?? options.other ?? ''
      result += chosen.replace(/#/g, String(count))
    } else {
      // A plain `{placeholder}` — keep it for the interpolation pass.
      result += template.slice(start, end + 1)
    }
    i = end + 1
  }
  return result
}

/** Replace `{name}` placeholders; unknown names are left as-is. */
function interpolate(template: string, vars: TranslationVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  )
}

/** Format a message template with the given variables. */
export function formatMessage(template: string, vars: TranslationVars = {}): string {
  return interpolate(resolvePlurals(template, vars), vars)
}
