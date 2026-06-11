import { describe, it, expect } from 'vitest'
import { assertSafeArchivePaths } from '../../src/main/plugins/plugin-host'

describe('assertSafeArchivePaths (zip-slip guard)', () => {
  it('accepts normal nested entries', () => {
    expect(() =>
      assertSafeArchivePaths([
        'my-plugin/',
        'my-plugin/manifest.json',
        'my-plugin/dist/index.js',
        '', // blank lines (from listing output) are ignored
      ]),
    ).not.toThrow()
  })

  it('rejects a parent-traversal entry', () => {
    expect(() => assertSafeArchivePaths(['my-plugin/../../etc/passwd'])).toThrow(/traversal/)
    expect(() => assertSafeArchivePaths(['../evil.js'])).toThrow(/traversal/)
  })

  it('rejects a backslash-traversal entry (Windows-style)', () => {
    expect(() => assertSafeArchivePaths(['my-plugin\\..\\..\\evil'])).toThrow(/traversal/)
  })

  it('rejects an absolute POSIX path', () => {
    expect(() => assertSafeArchivePaths(['/etc/cron.d/evil'])).toThrow(/absolute/)
  })

  it('rejects a Windows drive-letter path', () => {
    expect(() => assertSafeArchivePaths(['C:\\Windows\\System32\\evil.dll'])).toThrow(/absolute/)
  })

  it('throws on the first bad entry even amid valid ones', () => {
    expect(() =>
      assertSafeArchivePaths(['ok/a.js', '../escape', 'ok/b.js']),
    ).toThrow()
  })
})
