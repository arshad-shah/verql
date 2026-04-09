# Color Picker Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the native `<input type="color">` in ColorInput with a custom HSV-based color picker ported from css-inspector, slimmed to solid-color only and styled for dbstudio.

**Architecture:** Three files — `color-utils.ts` (pure conversion functions), `ColorPicker.tsx` (the picker panel with HSV canvas, hue/alpha sliders, format switching, presets, eyedropper), and an updated `ColorInput.tsx` that renders ColorPicker in its dropdown instead of the native input. TDD throughout — unit tests for utils, Storybook stories for components.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, CVA, Vitest, Storybook 9

**Spec:** `docs/superpowers/specs/2026-04-09-color-picker-port-design.md`

---

### Task 1: Color Utility Functions — Tests

**Files:**
- Create: `tests/unit/primitives/forms/color-utils.test.ts`

- [ ] **Step 1: Write tests for all color conversion and parsing functions**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- --run tests/unit/primitives/forms/color-utils.test.ts`
Expected: FAIL — module `color-utils` does not exist yet

- [ ] **Step 3: Commit test file**

```bash
git add tests/unit/primitives/forms/color-utils.test.ts
git commit -m "test: add color-utils unit tests (red)"
```

---

### Task 2: Color Utility Functions — Implementation

**Files:**
- Create: `src/renderer/src/primitives/forms/color-utils.ts`

- [ ] **Step 1: Implement all color utility functions**

Port the conversion functions from css-inspector's `color-picker.js` (lines 15–156), cutting HWB and named colors. Add `formatColor` and `isValidColor` which are new.

```ts
const round = Math.round

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = ((h % 360) + 360) % 360
  s /= 100
  v /= 100
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r: number, g: number, b: number
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return [round((r + m) * 255), round((g + m) * 255), round((b + m) * 255)]
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [round(h), round(s * 100), round(v * 100)]
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + 6) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [round(h), round(s * 100), round(l * 100)]
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r: number, g: number, b: number
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return [round((r + m) * 255), round((g + m) * 255), round((b + m) * 255)]
}

export function rgbToHex(r: number, g: number, b: number, a: number = 1): string {
  const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
  return a < 1 ? hex + round(a * 255).toString(16).padStart(2, '0') : hex
}

export function hexToRgb(hex: string): [number, number, number, number] {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  const r = parseInt(hex.slice(0, 2), 16) || 0
  const g = parseInt(hex.slice(2, 4), 16) || 0
  const b = parseInt(hex.slice(4, 6), 16) || 0
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
  return [r, g, b, a]
}

export function parseColor(str: string): [number, number, number, number] {
  str = str.trim().toLowerCase()

  if (str === 'transparent') return [0, 0, 0, 0]

  if (str.startsWith('#')) return hexToRgb(str)

  let m = str.match(/rgba?\s*\(\s*([\d.]+)\s*,?\s*([\d.]+)\s*,?\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)/)
  if (m) {
    const a = m[4] ? (m[4].includes('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1
    return [+m[1], +m[2], +m[3], a]
  }

  m = str.match(/hsla?\s*\(\s*([\d.]+)\s*,?\s*([\d.]+)%?\s*,?\s*([\d.]+)%?\s*(?:[,/]\s*([\d.]+%?))?\s*\)/)
  if (m) {
    const a = m[4] ? (m[4].includes('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1
    const [r, g, b] = hslToRgb(+m[1], +m[2], +m[3])
    return [r, g, b, a]
  }

  return [255, 0, 0, 1]
}

export function formatColor(r: number, g: number, b: number, a: number, format: 'hex' | 'rgb' | 'hsl'): string {
  const roundedA = round(a * 100) / 100
  switch (format) {
    case 'hex':
      return rgbToHex(r, g, b, a)
    case 'rgb':
      return a < 1 ? `rgba(${r}, ${g}, ${b}, ${roundedA})` : `rgb(${r}, ${g}, ${b})`
    case 'hsl': {
      const [h, s, l] = rgbToHsl(r, g, b)
      return a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${roundedA})` : `hsl(${h}, ${s}%, ${l}%)`
    }
    default:
      return rgbToHex(r, g, b, a)
  }
}

export function isValidColor(str: string): boolean {
  if (!str) return false
  str = str.trim().toLowerCase()
  if (str === 'transparent') return true
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(str)) return true
  if (/^rgba?\s*\(/.test(str)) return true
  if (/^hsla?\s*\(/.test(str)) return true
  return false
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `pnpm test -- --run tests/unit/primitives/forms/color-utils.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/forms/color-utils.ts
git commit -m "feat: add color-utils conversion functions"
```

---

### Task 3: ColorPicker Component

**Files:**
- Create: `src/renderer/src/primitives/forms/ColorPicker.tsx`

**Reference:** css-inspector `color-picker.js` lines 217–594 (ColorPicker class). Port the init, bindEvents, renderSwatches, renderInputs, onInputChange, setColor, update, updateInputs, getColorString methods. Cut gradient-related code entirely.

- [ ] **Step 1: Create the ColorPicker component**

```tsx
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '../utils/cn'
import {
  clamp,
  hsvToRgb,
  rgbToHsv,
  rgbToHsl,
  rgbToHex,
  parseColor,
  formatColor,
  isValidColor,
} from './color-utils'

export type ColorFormat = 'hex' | 'rgb' | 'hsl'

export interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  format?: ColorFormat
  presets?: string[]
  showEyeDropper?: boolean
  showPresets?: boolean
}

const DEFAULT_PRESETS = [
  '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80',
  '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080',
  '#ffffff', '#c0c0c0', '#808080', '#404040', '#000000', 'transparent',
]

const HUE_GRADIENT = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
const CHECKER_BG = 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px'

export function ColorPicker({
  value,
  onChange,
  format: initialFormat = 'hex',
  presets = DEFAULT_PRESETS,
  showEyeDropper = true,
  showPresets = true,
}: ColorPickerProps) {
  const [h, setH] = useState(0)
  const [s, setS] = useState(100)
  const [v, setV] = useState(100)
  const [a, setA] = useState(1)
  const [format, setFormat] = useState<ColorFormat>(initialFormat)
  const [copyLabel, setCopyLabel] = useState('Copy')

  const svRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const alphaRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  // Sync from prop on mount and when value changes externally
  useEffect(() => {
    const [r, g, b, alpha] = parseColor(value)
    const [hv, sv, vv] = rgbToHsv(r, g, b)
    setH(hv); setS(sv); setV(vv); setA(alpha)
  }, [value])

  const fireChange = useCallback(
    (h: number, s: number, v: number, a: number) => {
      const [r, g, b] = hsvToRgb(h, s, v)
      onChange(formatColor(r, g, b, a, format))
    },
    [onChange, format]
  )

  // --- Drag helper ---
  const useDrag = useCallback(
    (ref: React.RefObject<HTMLDivElement | null>, onMove: (e: PointerEvent, rect: DOMRect) => void) => {
      return (e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const el = ref.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        onMove(e.nativeEvent, rect)

        const move = (ev: PointerEvent) => { ev.preventDefault(); onMove(ev, rect) }
        const up = () => {
          document.removeEventListener('pointermove', move)
          document.removeEventListener('pointerup', up)
        }
        document.addEventListener('pointermove', move)
        document.addEventListener('pointerup', up)
      }
    },
    []
  )

  // --- SV canvas drag ---
  const handleSvDrag = useDrag(svRef, (e, rect) => {
    const ns = clamp((e.clientX - rect.left) / rect.width * 100, 0, 100)
    const nv = clamp(100 - (e.clientY - rect.top) / rect.height * 100, 0, 100)
    setS(ns); setV(nv)
    fireChange(h, ns, nv, a)
  })

  // --- Hue track drag ---
  const handleHueDrag = useDrag(hueRef, (e, rect) => {
    const nh = clamp((e.clientX - rect.left) / rect.width * 360, 0, 360)
    setH(nh)
    fireChange(nh, s, v, a)
  })

  // --- Alpha track drag ---
  const handleAlphaDrag = useDrag(alphaRef, (e, rect) => {
    const na = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    setA(na)
    fireChange(h, s, v, na)
  })

  // --- Derived values ---
  const [r, g, b] = hsvToRgb(h, s, v)
  const rgba = `rgba(${r},${g},${b},${a})`
  const hueColor = `hsl(${h},100%,50%)`
  const alphaGradient = `linear-gradient(to right, transparent, rgb(${r},${g},${b}))`

  // --- Format inputs ---
  const handleInputChange = useCallback(
    (updates: Record<string, string>) => {
      if (format === 'hex') {
        const hex = updates.hex || ''
        if (isValidColor(hex.startsWith('#') ? hex : '#' + hex)) {
          const [nr, ng, nb, na] = parseColor(hex.startsWith('#') ? hex : '#' + hex)
          const [nh, ns, nv] = rgbToHsv(nr, ng, nb)
          setH(nh); setS(ns); setV(nv); setA(na)
          fireChange(nh, ns, nv, na)
        }
      } else if (format === 'rgb') {
        const nr = clamp(+(updates.r ?? r), 0, 255)
        const ng = clamp(+(updates.g ?? g), 0, 255)
        const nb = clamp(+(updates.b ?? b), 0, 255)
        const na = clamp(+(updates.a ?? a), 0, 1)
        const [nh, ns, nv] = rgbToHsv(nr, ng, nb)
        setH(nh); setS(ns); setV(nv); setA(na)
        fireChange(nh, ns, nv, na)
      } else if (format === 'hsl') {
        const [, , , hslH, hslS, hslL] = (() => {
          const [ch, cs, cl] = rgbToHsl(r, g, b)
          return [r, g, b, ch, cs, cl]
        })()
        const nh = clamp(+(updates.h ?? hslH), 0, 360)
        const ns = clamp(+(updates.s ?? hslS), 0, 100)
        const nl = clamp(+(updates.l ?? hslL), 0, 100)
        const na = clamp(+(updates.a ?? a), 0, 1)
        const [cr, cg, cb] = hslToRgb(nh, ns, nl)
        const [cvh, cvs, cvv] = rgbToHsv(cr, cg, cb)
        setH(cvh); setS(cvs); setV(cvv); setA(na)
        fireChange(cvh, cvs, cvv, na)
      }
    },
    [format, r, g, b, a, h, fireChange]
  )

  // --- Eyedropper ---
  const handleEyeDropper = useCallback(async () => {
    if (!('EyeDropper' in window)) return
    try {
      const result = await new (window as any).EyeDropper().open()
      const [nr, ng, nb] = parseColor(result.sRGBHex)
      const [nh, ns, nv] = rgbToHsv(nr, ng, nb)
      setH(nh); setS(ns); setV(nv); setA(1)
      fireChange(nh, ns, nv, 1)
    } catch {
      // User cancelled
    }
  }, [fireChange])

  // --- Copy ---
  const handleCopy = useCallback(() => {
    const colorStr = formatColor(r, g, b, a, format)
    navigator.clipboard.writeText(colorStr)
    setCopyLabel('Copied!')
    setTimeout(() => setCopyLabel('Copy'), 1000)
  }, [r, g, b, a, format])

  // --- Preset click ---
  const handlePresetClick = useCallback(
    (color: string) => {
      const [nr, ng, nb, na] = parseColor(color)
      const [nh, ns, nv] = rgbToHsv(nr, ng, nb)
      setH(nh); setS(ns); setV(nv); setA(na)
      fireChange(nh, ns, nv, na)
    },
    [fireChange]
  )

  // --- Input field values ---
  const hexValue = rgbToHex(r, g, b, a)
  const [hslH, hslS, hslL] = rgbToHsl(r, g, b)
  const roundedA = Math.round(a * 100) / 100

  const hasEyeDropper = showEyeDropper && typeof window !== 'undefined' && 'EyeDropper' in window

  return (
    <div
      className="w-[240px] rounded-lg border border-border-default bg-bg-secondary p-3 shadow-[var(--shadow-dropdown)]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HSV Saturation/Value Canvas */}
      <div
        ref={svRef}
        className="relative h-[160px] w-full cursor-crosshair rounded overflow-hidden select-none"
        onPointerDown={handleSvDrag}
      >
        <div className="absolute inset-0" style={{ background: hueColor }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }} />
        {/* Pointer */}
        <div
          className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md pointer-events-none"
          style={{ left: `${s}%`, top: `${100 - v}%` }}
        />
      </div>

      {/* Sliders row */}
      <div className="mt-3 flex items-center gap-2">
        {/* Color preview */}
        <div
          className="w-8 h-8 rounded border border-border-default shrink-0 overflow-hidden"
          style={{ background: CHECKER_BG }}
        >
          <div className="w-full h-full" style={{ background: rgba }} />
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          {/* Hue track */}
          <div
            ref={hueRef}
            className="relative h-3 w-full rounded-full cursor-pointer select-none"
            style={{ background: HUE_GRADIENT }}
            onPointerDown={handleHueDrag}
          >
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{ left: `${(h / 360) * 100}%` }}
            />
          </div>

          {/* Alpha track */}
          <div
            ref={alphaRef}
            className="relative h-3 w-full rounded-full cursor-pointer select-none overflow-hidden"
            style={{ background: CHECKER_BG }}
            onPointerDown={handleAlphaDrag}
          >
            <div className="absolute inset-0 rounded-full" style={{ background: alphaGradient }} />
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{ left: `${a * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions row: eyedropper + copy */}
      <div className="mt-2 flex items-center gap-1">
        {hasEyeDropper && (
          <button
            type="button"
            onClick={handleEyeDropper}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-all duration-[var(--transition-fast)]"
            title="Pick from screen"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.71 5.63l-2.34-2.34a1 1 0 00-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.42 1.41-9.19 9.19a1 1 0 000 1.41l2.34 2.34a1 1 0 001.41 0l9.19-9.19 1.42 1.42 1.41-1.42-1.41-1.41 3.12-3.12a1 1 0 000-1.41zM6.41 19L5 17.59l8.49-8.49 1.41 1.41L6.41 19z" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'ml-auto px-2 py-0.5 rounded text-xs transition-all duration-[var(--transition-fast)]',
            copyLabel === 'Copied!'
              ? 'text-success bg-success/10'
              : 'text-text-muted hover:text-text-primary hover:bg-hover'
          )}
        >
          {copyLabel}
        </button>
      </div>

      {/* Format buttons */}
      <div className="mt-2 flex gap-1">
        {(['hex', 'rgb', 'hsl'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFormat(f)}
            className={cn(
              'flex-1 py-1 rounded text-xs font-medium uppercase transition-all duration-[var(--transition-fast)]',
              format === f
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text-primary hover:bg-hover'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Input fields */}
      <div className="mt-2 flex gap-1">
        {format === 'hex' ? (
          <div className="flex-1 flex flex-col items-center">
            <input
              type="text"
              value={hexValue}
              onChange={(e) => handleInputChange({ hex: e.target.value })}
              className="w-full h-6 px-1.5 rounded border border-border-default bg-bg-tertiary text-text-primary text-xs text-center font-mono outline-none focus:border-accent transition-colors"
            />
            <span className="text-[10px] text-text-muted mt-0.5">HEX</span>
          </div>
        ) : format === 'rgb' ? (
          <>
            {[
              { id: 'r', label: 'R', value: r, max: 255 },
              { id: 'g', label: 'G', value: g, max: 255 },
              { id: 'b', label: 'B', value: b, max: 255 },
              { id: 'a', label: 'A', value: roundedA, max: 1, step: 0.01 },
            ].map((field) => (
              <div key={field.id} className="flex-1 flex flex-col items-center">
                <input
                  type="number"
                  value={field.value}
                  min={0}
                  max={field.max}
                  step={field.step}
                  onChange={(e) => handleInputChange({ [field.id]: e.target.value })}
                  className="w-full h-6 px-1 rounded border border-border-default bg-bg-tertiary text-text-primary text-xs text-center font-mono outline-none focus:border-accent transition-colors [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-text-muted mt-0.5">{field.label}</span>
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              { id: 'h', label: 'H', value: hslH, max: 360 },
              { id: 's', label: 'S', value: hslS, max: 100 },
              { id: 'l', label: 'L', value: hslL, max: 100 },
              { id: 'a', label: 'A', value: roundedA, max: 1, step: 0.01 },
            ].map((field) => (
              <div key={field.id} className="flex-1 flex flex-col items-center">
                <input
                  type="number"
                  value={field.value}
                  min={0}
                  max={field.max}
                  step={field.step}
                  onChange={(e) => handleInputChange({ [field.id]: e.target.value })}
                  className="w-full h-6 px-1 rounded border border-border-default bg-bg-tertiary text-text-primary text-xs text-center font-mono outline-none focus:border-accent transition-colors [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-text-muted mt-0.5">{field.label}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Preset swatches */}
      {showPresets && presets.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {presets.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handlePresetClick(color)}
              className={cn(
                'w-5 h-5 rounded border transition-all duration-[var(--transition-fast)] hover:scale-110',
                (() => {
                  const [pr, pg, pb] = parseColor(color)
                  return pr === r && pg === g && pb === b
                    ? 'border-accent scale-110'
                    : 'border-border-default'
                })()
              )}
              style={{
                background: color === 'transparent' ? CHECKER_BG : color,
              }}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Export from the forms index**

Add to `src/renderer/src/primitives/forms/index.ts`:

```ts
export { ColorPicker } from './ColorPicker'
export type { ColorPickerProps, ColorFormat } from './ColorPicker'
```

Also export the color-utils:

```ts
export { parseColor, formatColor, isValidColor } from './color-utils'
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/forms/ColorPicker.tsx src/renderer/src/primitives/forms/color-utils.ts src/renderer/src/primitives/forms/index.ts
git commit -m "feat: add ColorPicker component with HSV canvas, sliders, format switching"
```

---

### Task 4: ColorPicker Stories

**Files:**
- Create: `src/renderer/src/primitives/forms/ColorPicker.stories.tsx`

- [ ] **Step 1: Create stories**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { useState } from 'react'
import { ColorPicker } from './ColorPicker'

const onChangeMock = fn()

const meta: Meta<typeof ColorPicker> = {
  title: 'Primitives/Forms/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: 'var(--color-bg-primary)' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof ColorPicker>

export const Default: Story = {
  render: function Render() {
    const [color, setColor] = useState('#7c6ff7')
    return (
      <ColorPicker
        value={color}
        onChange={(c) => { setColor(c); onChangeMock(c) }}
      />
    )
  },
  play: async ({ canvas }) => {
    // Click the RGB format button
    const rgbBtn = canvas.getByRole('button', { name: 'rgb' })
    await userEvent.click(rgbBtn)
    // Verify RGB inputs appear
    await expect(canvas.getByText('R')).toBeInTheDocument()
    await expect(canvas.getByText('G')).toBeInTheDocument()
    await expect(canvas.getByText('B')).toBeInTheDocument()
  },
}

export const WithPresets: Story = {
  render: function Render() {
    const [color, setColor] = useState('#ff5555')
    return (
      <ColorPicker
        value={color}
        onChange={setColor}
        presets={['#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#ff79c6', '#8be9fd']}
      />
    )
  },
}

export const NoPresets: Story = {
  render: function Render() {
    const [color, setColor] = useState('#0080ff')
    return <ColorPicker value={color} onChange={setColor} showPresets={false} />
  },
}

export const HSLFormat: Story = {
  render: function Render() {
    const [color, setColor] = useState('#7c6ff7')
    return <ColorPicker value={color} onChange={setColor} format="hsl" />
  },
}
```

- [ ] **Step 2: Run story tests**

Use the Storybook MCP `run-story-tests` tool to verify stories render and the play function passes.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/forms/ColorPicker.stories.tsx
git commit -m "feat: add ColorPicker stories"
```

---

### Task 5: Update ColorInput to Use ColorPicker

**Files:**
- Modify: `src/renderer/src/primitives/forms/ColorInput.tsx`

- [ ] **Step 1: Replace native color input with ColorPicker in the dropdown**

Rewrite `ColorInput.tsx`. Keep the same public API (`ColorInputProps`). Replace the `<input type="color">` section with `<ColorPicker>`. Keep the outer structure: swatch button + text input + dropdown panel.

```tsx
import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'
import { ColorPicker } from './ColorPicker'
import { parseColor, rgbToHex, isValidColor } from './color-utils'

const colorInputVariants = cva(
  'flex items-center gap-2 border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus-within:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] border-border-default hover:border-border-strong',
  {
    variants: {
      size: {
        xs: 'h-6 px-2 text-xs rounded',
        sm: 'h-7 px-2 text-xs rounded',
        md: 'h-8 px-3 text-sm rounded-md',
        lg: 'h-9 px-3 text-sm rounded-md',
        xl: 'h-10 px-4 text-base rounded-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

function isValidHex(s: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s)
}

export interface ColorInputProps extends VariantProps<typeof colorInputVariants> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  presets?: string[]
  showPicker?: boolean
  disabled?: boolean
  className?: string
}

export const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  ({ value: controlledValue, defaultValue = '#7c6ff7', onChange, presets, showPicker = true, disabled, size, className }, ref) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue)
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const currentValue = isControlled ? controlledValue : internalValue

    const setValue = (v: string) => {
      if (!isControlled) setInternalValue(v)
      onChange?.(v)
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      if (!isControlled) setInternalValue(raw)
      if (isValidHex(raw)) onChange?.(raw)
    }

    const handleBlur = () => {
      if (!isValidHex(currentValue)) {
        setValue(defaultValue)
      }
    }

    const handlePickerChange = (color: string) => {
      // ColorPicker emits formatted strings; extract hex for the text input
      const [r, g, b] = parseColor(color)
      const hex = rgbToHex(r, g, b)
      setValue(hex)
    }

    useEffect(() => {
      if (!isOpen) return
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [isOpen])

    // Close on Escape
    useEffect(() => {
      if (!isOpen) return
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false)
      }
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }, [isOpen])

    return (
      <div ref={containerRef} className="relative">
        <div className={cn(colorInputVariants({ size }), disabled && 'opacity-50 pointer-events-none', className)}>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => showPicker && setIsOpen(!isOpen)}
            className="shrink-0"
            aria-label="Pick color"
          >
            <div
              className="w-5 h-5 rounded border border-border-default"
              style={{ backgroundColor: isValidHex(currentValue) ? currentValue : defaultValue }}
            />
          </button>
          <input
            ref={ref}
            type="text"
            value={currentValue}
            onChange={handleTextChange}
            onBlur={handleBlur}
            disabled={disabled}
            className="flex-1 h-full bg-transparent outline-none min-w-0 font-mono text-inherit"
            maxLength={7}
          />
        </div>

        {isOpen && showPicker && (
          <div className="absolute top-full left-0 mt-1 z-50">
            <ColorPicker
              value={isValidHex(currentValue) ? currentValue : defaultValue}
              onChange={handlePickerChange}
              presets={presets}
            />
          </div>
        )}
      </div>
    )
  }
)

ColorInput.displayName = 'ColorInput'
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/primitives/forms/ColorInput.tsx
git commit -m "feat: replace native color input with custom ColorPicker in ColorInput"
```

---

### Task 6: Update ColorInput Stories

**Files:**
- Modify: `src/renderer/src/primitives/forms/ColorInput.stories.tsx`

- [ ] **Step 1: Update stories to exercise the new picker**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn, expect, userEvent } from 'storybook/test'
import { ColorInput } from './ColorInput'

const meta: Meta<typeof ColorInput> = {
  title: 'Primitives/Forms/ColorInput',
  component: ColorInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
    showPicker: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof ColorInput>

const onChangeMock = fn()

export const Default: Story = {
  render: function Render() {
    const [color, setColor] = useState('#7c6ff7')
    return (
      <div className="w-48">
        <ColorInput value={color} onChange={(next) => { setColor(next); onChangeMock(next) }} />
      </div>
    )
  },
  play: async ({ canvas }) => {
    // Verify initial value
    const input = canvas.getByRole('textbox')
    await expect(input).toHaveValue('#7c6ff7')
    // Open picker
    const swatch = canvas.getByLabelText('Pick color')
    await userEvent.click(swatch)
    // Verify picker panel appeared — format buttons visible
    await expect(canvas.getByRole('button', { name: 'hex' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'rgb' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'hsl' })).toBeInTheDocument()
  },
}

export const WithPresets: Story = {
  args: {
    defaultValue: '#7c6ff7',
    presets: ['#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#ff79c6', '#8be9fd', '#7c6ff7', '#61afef'],
  },
  decorators: [(Story) => <div className="w-48"><Story /></div>],
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-48">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <ColorInput key={size} defaultValue="#7c6ff7" size={size} />
      ))}
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    defaultValue: '#7c6ff7',
    disabled: true,
  },
  decorators: [(Story) => <div className="w-48"><Story /></div>],
}
```

- [ ] **Step 2: Run story tests for both ColorPicker and ColorInput**

Use the Storybook MCP `run-story-tests` tool to verify all stories pass.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/forms/ColorInput.stories.tsx
git commit -m "feat: update ColorInput stories for custom picker"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run all unit tests**

Run: `pnpm test -- --run tests/unit/primitives/forms/color-utils.test.ts`
Expected: All PASS

- [ ] **Step 2: Run all story tests**

Use the Storybook MCP `run-story-tests` tool with no filter to run the full suite. All stories should pass (component tests). Pre-existing a11y color contrast issues are expected and not in scope.

- [ ] **Step 3: Visual review**

Use the Storybook MCP `preview-stories` tool to get URLs for:
- `primitives-forms-colorpicker--default`
- `primitives-forms-colorinput--default`

Share URLs with the user for visual sign-off.
