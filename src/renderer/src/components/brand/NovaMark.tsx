/**
 * Nova brand mark components.
 *
 * Geometry lives in `assets/brand/*.svg` — those files are the source of
 * truth. Edit the SVG, get the new shape everywhere.
 *
 * We render the SVG via a CSS `mask-image` rather than inlining it. Tradeoffs:
 *   - ✓ One source SVG file. Edit it, every consumer updates.
 *   - ✓ Inherits theme color via `background-color: currentColor`, so the
 *     mark adapts to dark/light and accent slots without JS.
 *   - ✓ No `dangerouslySetInnerHTML`, no runtime sanitiser.
 *   - ✗ Opacity layers inside the SVG don't translate through the mask
 *     (a mask is binary alpha). The hero SVG uses opacity for the
 *     concentric rings — those render as solid silhouettes. That's an
 *     acceptable simplification: the mark still reads, and complexity
 *     inside the asset stays editable upstream.
 *
 * If we ever need full-colour fidelity (e.g. multi-stop gradients) we can
 * switch a specific consumer to an `<img>` tag or a separate inline-SVG
 * component without changing this file's API.
 */

// `?url` is a Vite primitive — imports the file's served URL at build time.
import novaMarkUrl from '@/assets/brand/nova-mark.svg?url'
import novaHeroUrl from '@/assets/brand/nova-hero.svg?url'

interface MarkProps {
  size?: number
  className?: string
  /** Force a contrast palette regardless of inherited color. */
  tone?: 'light' | 'dark'
}

function maskStyle(url: string, size: number, tone?: 'light' | 'dark'): React.CSSProperties {
  const color = tone === 'light' ? '#f5f3ff' : tone === 'dark' ? '#1a1330' : 'currentColor'
  return {
    display: 'inline-block',
    width: size,
    height: size,
    backgroundColor: color,
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  }
}

export function NovaMark({ size = 16, className, tone }: MarkProps) {
  return <span className={className} style={maskStyle(novaMarkUrl, size, tone)} aria-hidden="true" />
}

export function NovaHero({ size = 120, className }: { size?: number; className?: string }) {
  return <span className={className} style={maskStyle(novaHeroUrl, size)} aria-hidden="true" />
}
