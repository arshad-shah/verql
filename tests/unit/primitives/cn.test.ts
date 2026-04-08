import { describe, it, expect } from 'vitest'
import { cn } from '../../../src/renderer/src/primitives/utils/cn'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  it('handles conditional classes', () => {
    expect(cn('flex', false && 'hidden', 'gap-2')).toBe('flex gap-2')
  })

  it('deduplicates conflicting tailwind classes', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })

  it('handles undefined and null', () => {
    expect(cn('flex', undefined, null, 'gap-2')).toBe('flex gap-2')
  })
})
