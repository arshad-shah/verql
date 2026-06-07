import React, { Fragment } from 'react'
import {
  Command,
  Option,
  ArrowBigUp,
  ChevronUp,
  CornerDownLeft,
  Delete,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowRightToLine,
  Space,
  type LucideIcon,
} from 'lucide-react'
import { Kbd, type KbdProps } from './Kbd'
import { cn } from '../utils/cn'

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform)

/** Local SVG fill-ins for keys Lucide doesn't model well. */
const EscapeGlyph = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 9 L3 11 L13 11 L13 5" />
    <path d="M6 6 L3 9 L6 12" />
  </svg>
)

type GlyphFn = (size: number) => React.ReactNode

const lucide = (Icon: LucideIcon): GlyphFn => (size) => <Icon size={size} aria-hidden="true" />

/** Canonical-token → glyph renderer. Keys are lowercase. */
const GLYPHS: Record<string, GlyphFn> = {
  cmd: lucide(Command),
  command: lucide(Command),
  meta: lucide(Command),
  ctrl: lucide(ChevronUp),
  control: lucide(ChevronUp),
  shift: lucide(ArrowBigUp),
  alt: lucide(Option),
  option: lucide(Option),
  enter: lucide(CornerDownLeft),
  return: lucide(CornerDownLeft),
  backspace: lucide(Delete),
  delete: lucide(Delete),
  up: lucide(ArrowUp),
  arrowup: lucide(ArrowUp),
  down: lucide(ArrowDown),
  arrowdown: lucide(ArrowDown),
  left: lucide(ArrowLeft),
  arrowleft: lucide(ArrowLeft),
  right: lucide(ArrowRight),
  arrowright: lucide(ArrowRight),
  tab: lucide(ArrowRightToLine),
  space: lucide(Space),
  escape: (size) => <EscapeGlyph size={size} />,
  esc: (size) => <EscapeGlyph size={size} />,
}

/** Resolve platform-conditional tokens (mod, cmdorctrl) into a concrete key. */
function resolveToken(raw: string): string {
  const t = raw.trim().toLowerCase()
  if (t === 'mod' || t === 'cmdorctrl' || t === 'commandorcontrol') {
    return IS_MAC ? 'cmd' : 'ctrl'
  }
  return t
}

/** Icon size to render inside a Kbd of the given size. */
function glyphSize(size: KbdProps['size']): number {
  if (size === 'xs') return 9
  if (size === 'sm') return 10
  if (size === 'lg') return 14
  if (size === 'xl') return 16
  return 12
}

function parseAccelerator(accelerator: string): string[] {
  return accelerator
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean)
}

function renderKeyContent(token: string, size: KbdProps['size']): React.ReactNode {
  const glyph = GLYPHS[token]
  if (glyph) return glyph(glyphSize(size))
  // Letters, digits, F-keys, punctuation → keep the character form, uppercased.
  return <span>{token.length === 1 ? token.toUpperCase() : token.toUpperCase()}</span>
}

type SeparatorKind = 'gap' | 'plus'

export type KbdGroupProps = {
  /** Tokens to render. Either pass `keys` or `accelerator`. */
  keys?: string[]
  /** Electron-style accelerator string, e.g. "CmdOrCtrl+Shift+P". */
  accelerator?: string
  size?: KbdProps['size']
  variant?: KbdProps['variant']
  /** `gap` (default) = bare spacing between chips. `plus` = render a muted "+" between them. */
  separator?: SeparatorKind | React.ReactNode
  className?: string
  /** Accessible label. Defaults to the joined token list. */
  'aria-label'?: string
}

export function KbdGroup({
  keys,
  accelerator,
  size = 'md',
  variant = 'solid',
  separator = 'gap',
  className,
  'aria-label': ariaLabel,
}: KbdGroupProps) {
  const rawTokens = keys ?? (accelerator ? parseAccelerator(accelerator) : [])
  const tokens = rawTokens.map(resolveToken)

  const sepNode: React.ReactNode | null =
    separator === 'gap'
      ? null
      : separator === 'plus'
        ? <span className="text-text-tertiary text-xs px-0.5 select-none">+</span>
        : (separator as React.ReactNode)

  const label = ariaLabel ?? rawTokens.join('+')

  return (
    <span
      className={cn('inline-flex items-center gap-1 align-middle', className)}
      aria-label={label}
    >
      {tokens.map((token, i) => (
        <Fragment key={`${token}-${i}`}>
          {i > 0 && sepNode}
          <Kbd size={size} variant={variant}>
            {renderKeyContent(token, size)}
          </Kbd>
        </Fragment>
      ))}
    </span>
  )
}

KbdGroup.displayName = 'KbdGroup'
