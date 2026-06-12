import { describe, it, expect } from 'vitest'
// The renderer is a plain ESM script (shared by CI + local); import its pure core.
import { render } from '../../scripts/render-homebrew.mjs'

describe('render-homebrew', () => {
  it('substitutes every placeholder', () => {
    const out = render('v={{VERSION}} sha={{SHA_X64}}', {
      VERSION: '1.4.0',
      SHA_X64: 'abc123',
    })
    expect(out).toBe('v=1.4.0 sha=abc123')
  })

  it('replaces all occurrences of a repeated placeholder', () => {
    const out = render('{{VERSION}}-{{VERSION}}', { VERSION: '2.0.0' })
    expect(out).toBe('2.0.0-2.0.0')
  })

  it('fails closed when a placeholder is left unresolved', () => {
    expect(() => render('{{VERSION}} {{SHA_MISSING}}', { VERSION: '1.0.0' })).toThrow(
      /unresolved placeholder/i,
    )
  })

  it('does not treat a provided-but-empty value as unresolved', () => {
    // Empty string is a legitimate value; only a literal {{TOKEN}} is an error.
    const out = render('a={{A}}|b={{B}}', { A: '', B: 'x' })
    expect(out).toBe('a=|b=x')
  })

  it('is idempotent — rendering the same inputs twice yields identical output', () => {
    const tmpl = 'version {{VERSION}} sha {{SHA_ARM64}}'
    const vars = { VERSION: '3.1.4', SHA_ARM64: 'deadbeef' }
    expect(render(tmpl, vars)).toBe(render(tmpl, vars))
  })
})
