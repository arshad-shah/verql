import { describe, it, expect } from 'vitest'
import { isWideMessageContent } from '../../src/renderer/src/components/ai/message-content-width'

describe('isWideMessageContent', () => {
  it('is snug for short prose', () => {
    expect(isWideMessageContent('1,284 users signed up today.')).toBe(false)
  })

  it('is snug for prose with an inline pipe or dash', () => {
    expect(isWideMessageContent('Use a left-join here — it is faster.')).toBe(false)
  })

  it('is wide when content has a fenced code block', () => {
    expect(isWideMessageContent('Plan:\n```sql\nSELECT 1\n```')).toBe(true)
  })

  it('is wide when content has a markdown table', () => {
    const table = 'Top regions:\n\n| Region | Revenue |\n| --- | --- |\n| EMEA | $4.2M |'
    expect(isWideMessageContent(table)).toBe(true)
  })

  it('is wide for a compact table delimiter', () => {
    const table = '| a | b |\n|---|---|\n| 1 | 2 |'
    expect(isWideMessageContent(table)).toBe(true)
  })
})
