import { describe, it, expect } from 'vitest'
import {
  validateTheme,
  REQUIRED_THEME_TOKENS,
  RECOMMENDED_THEME_TOKENS,
} from '../../src/main/plugins/sdk/theme-registry'

const buildTokens = (extras: Record<string, string> = {}): Record<string, string> => {
  const t: Record<string, string> = {}
  for (const k of REQUIRED_THEME_TOKENS) t[k] = '#000'
  return { ...t, ...extras }
}

describe('validateTheme', () => {
  it('passes when every required token is present via the tokens map', () => {
    const report = validateTheme({
      id: 't',
      name: 't',
      type: 'dark',
      tokens: buildTokens(),
    })
    expect(report.ok).toBe(true)
    expect(report.missingRequired).toEqual([])
  })

  it('passes when required tokens are declared inside a css body', () => {
    const css = `[data-theme="t"] {\n${REQUIRED_THEME_TOKENS.map((k) => `  ${k}: #000;`).join('\n')}\n}`
    const report = validateTheme({ id: 't', name: 't', type: 'dark', css })
    expect(report.ok).toBe(true)
  })

  it('flags every missing required token', () => {
    const report = validateTheme({
      id: 't',
      name: 't',
      type: 'dark',
      tokens: { '--color-accent': '#fff' },
    })
    expect(report.ok).toBe(false)
    expect(report.missingRequired).toContain('--color-bg-primary')
    expect(report.missingRequired).not.toContain('--color-accent')
  })

  it('separates required from recommended gaps', () => {
    const report = validateTheme({
      id: 't',
      name: 't',
      type: 'dark',
      tokens: buildTokens(), // required present, recommended absent
    })
    expect(report.ok).toBe(true)
    expect(report.missingRequired).toEqual([])
    // skeleton tokens are recommended-only — should surface here
    expect(report.missingRecommended).toContain('--color-skeleton-base')
    expect(report.missingRecommended).toContain('--color-skeleton-highlight')
  })

  it('accepts token keys with or without the -- prefix', () => {
    const tokens: Record<string, string> = {}
    for (const k of REQUIRED_THEME_TOKENS) tokens[k.replace(/^--/, '')] = '#000'
    const report = validateTheme({ id: 't', name: 't', type: 'dark', tokens })
    expect(report.ok).toBe(true)
  })

  it('reports clean when both required and recommended are present', () => {
    const tokens = buildTokens()
    for (const k of RECOMMENDED_THEME_TOKENS) tokens[k] = '#000'
    const report = validateTheme({ id: 't', name: 't', type: 'dark', tokens })
    expect(report.ok).toBe(true)
    expect(report.missingRecommended).toEqual([])
  })
})
