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
