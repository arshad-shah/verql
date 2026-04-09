import { describe, it, expect } from 'vitest'
import {
  clamp,
  hsvToRgb,
  rgbToHsv,
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  hexToRgb,
  parseColor,
  formatColor,
  isValidColor,
} from '../../../../src/renderer/src/primitives/forms/color-utils'

describe('clamp', () => {
  it('returns value when in range', () => {
    expect(clamp(50, 0, 100)).toBe(50)
  })
  it('clamps below min', () => {
    expect(clamp(-10, 0, 100)).toBe(0)
  })
  it('clamps above max', () => {
    expect(clamp(150, 0, 100)).toBe(100)
  })
})

describe('hsvToRgb', () => {
  it('converts pure red', () => {
    expect(hsvToRgb(0, 100, 100)).toEqual([255, 0, 0])
  })
  it('converts pure green', () => {
    expect(hsvToRgb(120, 100, 100)).toEqual([0, 255, 0])
  })
  it('converts pure blue', () => {
    expect(hsvToRgb(240, 100, 100)).toEqual([0, 0, 255])
  })
  it('converts white (s=0, v=100)', () => {
    expect(hsvToRgb(0, 0, 100)).toEqual([255, 255, 255])
  })
  it('converts black (v=0)', () => {
    expect(hsvToRgb(0, 100, 0)).toEqual([0, 0, 0])
  })
  it('converts mid-gray', () => {
    expect(hsvToRgb(0, 0, 50)).toEqual([128, 128, 128])
  })
})

describe('rgbToHsv', () => {
  it('converts pure red', () => {
    expect(rgbToHsv(255, 0, 0)).toEqual([0, 100, 100])
  })
  it('converts pure green', () => {
    expect(rgbToHsv(0, 255, 0)).toEqual([120, 100, 100])
  })
  it('converts pure blue', () => {
    expect(rgbToHsv(0, 0, 255)).toEqual([240, 100, 100])
  })
  it('converts white', () => {
    expect(rgbToHsv(255, 255, 255)).toEqual([0, 0, 100])
  })
  it('converts black', () => {
    expect(rgbToHsv(0, 0, 0)).toEqual([0, 0, 0])
  })
})

describe('rgbToHsl', () => {
  it('converts pure red', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual([0, 100, 50])
  })
  it('converts white', () => {
    expect(rgbToHsl(255, 255, 255)).toEqual([0, 0, 100])
  })
  it('converts black', () => {
    expect(rgbToHsl(0, 0, 0)).toEqual([0, 0, 0])
  })
})

describe('hslToRgb', () => {
  it('converts pure red', () => {
    expect(hslToRgb(0, 100, 50)).toEqual([255, 0, 0])
  })
  it('converts pure green', () => {
    expect(hslToRgb(120, 100, 50)).toEqual([0, 255, 0])
  })
  it('converts pure blue', () => {
    expect(hslToRgb(240, 100, 50)).toEqual([0, 0, 255])
  })
})

describe('rgbToHex', () => {
  it('converts red to hex', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000')
  })
  it('converts with alpha', () => {
    expect(rgbToHex(255, 0, 0, 0.5)).toBe('#ff000080')
  })
  it('omits alpha when 1', () => {
    expect(rgbToHex(0, 128, 255, 1)).toBe('#0080ff')
  })
})

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0, 1])
  })
  it('parses 3-digit hex', () => {
    expect(hexToRgb('#f00')).toEqual([255, 0, 0, 1])
  })
  it('parses 8-digit hex with alpha', () => {
    expect(hexToRgb('#ff000080')).toEqual([255, 0, 0, expect.closeTo(0.5, 1)])
  })
  it('parses without hash', () => {
    expect(hexToRgb('00ff00')).toEqual([0, 255, 0, 1])
  })
})

describe('parseColor', () => {
  it('parses hex', () => {
    expect(parseColor('#ff0000')).toEqual([255, 0, 0, 1])
  })
  it('parses rgb()', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual([255, 0, 0, 1])
  })
  it('parses rgba()', () => {
    expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual([255, 0, 0, 0.5])
  })
  it('parses hsl()', () => {
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual([255, 0, 0, 1])
  })
  it('parses hsla()', () => {
    expect(parseColor('hsla(0, 100%, 50%, 0.5)')).toEqual([255, 0, 0, 0.5])
  })
  it('parses transparent', () => {
    expect(parseColor('transparent')).toEqual([0, 0, 0, 0])
  })
  it('returns red fallback for invalid input', () => {
    expect(parseColor('not-a-color')).toEqual([255, 0, 0, 1])
  })
})

describe('formatColor', () => {
  it('formats as hex', () => {
    expect(formatColor(255, 0, 0, 1, 'hex')).toBe('#ff0000')
  })
  it('formats as hex with alpha', () => {
    expect(formatColor(255, 0, 0, 0.5, 'hex')).toBe('#ff000080')
  })
  it('formats as rgb', () => {
    expect(formatColor(255, 0, 0, 1, 'rgb')).toBe('rgb(255, 0, 0)')
  })
  it('formats as rgba when alpha < 1', () => {
    expect(formatColor(255, 0, 0, 0.5, 'rgb')).toBe('rgba(255, 0, 0, 0.5)')
  })
  it('formats as hsl', () => {
    expect(formatColor(255, 0, 0, 1, 'hsl')).toBe('hsl(0, 100%, 50%)')
  })
  it('formats as hsla when alpha < 1', () => {
    expect(formatColor(255, 0, 0, 0.5, 'hsl')).toBe('hsla(0, 100%, 50%, 0.5)')
  })
})

describe('isValidColor', () => {
  it('validates hex', () => {
    expect(isValidColor('#ff0000')).toBe(true)
  })
  it('validates 3-digit hex', () => {
    expect(isValidColor('#f00')).toBe(true)
  })
  it('validates rgb()', () => {
    expect(isValidColor('rgb(255, 0, 0)')).toBe(true)
  })
  it('validates hsl()', () => {
    expect(isValidColor('hsl(0, 100%, 50%)')).toBe(true)
  })
  it('validates transparent', () => {
    expect(isValidColor('transparent')).toBe(true)
  })
  it('rejects invalid strings', () => {
    expect(isValidColor('not-a-color')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(isValidColor('')).toBe(false)
  })
})
