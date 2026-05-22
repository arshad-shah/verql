import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const rootVariants = cva('', {
  variants: {
    orientation: {
      horizontal: 'flex items-baseline gap-2',
      vertical: 'flex flex-col gap-0.5',
    },
    align: {
      between: 'justify-between',
      start: 'justify-start',
    },
  },
  compoundVariants: [
    { orientation: 'vertical', align: 'between', class: '' },
    { orientation: 'vertical', align: 'start', class: '' },
  ],
  defaultVariants: {
    orientation: 'horizontal',
    align: 'between',
  },
})

const labelVariants = cva('shrink-0', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
    },
  },
  defaultVariants: { size: 'sm' },
})

const valueVariants = cva('truncate', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
    },
    tone: {
      default: 'text-text-primary',
      muted: 'text-text-secondary',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
    },
    monospace: {
      true: 'font-mono',
      false: '',
    },
    orientation: {
      horizontal: 'text-right',
      vertical: 'text-left',
    },
  },
  defaultVariants: {
    size: 'sm',
    tone: 'default',
    monospace: false,
    orientation: 'horizontal',
  },
})

type RootVariants = VariantProps<typeof rootVariants>
type ValueVariants = VariantProps<typeof valueVariants>

export interface KeyValueProps {
  label: string
  value: React.ReactNode
  /** Layout direction. `horizontal` (default) shows label and value on one line;
   *  `vertical` stacks the value beneath the label (good for cards). */
  orientation?: RootVariants['orientation']
  /** Horizontal-only: `between` pushes label/value to opposite ends (default),
   *  `start` keeps them adjacent for left-aligned lists. */
  align?: RootVariants['align']
  /** Type scale. `sm` matches the previous default; `md` is for denser data blocks. */
  size?: ValueVariants['size']
  /** Semantic colour for the value text. */
  tone?: ValueVariants['tone']
  /** Render the value in a monospace font. Useful for IDs, hosts, ports, hashes. */
  monospace?: boolean
  /** Show a copy-to-clipboard button on hover. Only works when the value can be
   *  coerced to a string, or when `copyValue` is provided explicitly. */
  copyable?: boolean
  /** Override the string written to the clipboard when `copyable` is true. */
  copyValue?: string
  className?: string
  /** Optional class applied to the label (`<dt>`). */
  labelClassName?: string
  /** Optional class applied to the value (`<dd>`). */
  valueClassName?: string
}

function toCopyString(value: React.ReactNode, override?: string): string | null {
  if (override != null) return override
  if (value == null || typeof value === 'boolean') return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return null
}

export function KeyValue({
  label,
  value,
  orientation = 'horizontal',
  align = 'between',
  size = 'sm',
  tone = 'default',
  monospace = false,
  copyable = false,
  copyValue,
  className,
  labelClassName,
  valueClassName,
}: KeyValueProps) {
  const [copied, setCopied] = useState(false)
  const copyTarget = copyable ? toCopyString(value, copyValue) : null

  const handleCopy = async () => {
    if (!copyTarget) return
    try {
      await navigator.clipboard.writeText(copyTarget)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // Clipboard may be unavailable (insecure context); fail silently.
    }
  }

  const valueTitle = typeof value === 'string' ? value : undefined

  return (
    <dl className={cn(rootVariants({ orientation, align }), 'group/kv', className)}>
      <dt className={cn(labelVariants({ size }), 'text-text-secondary', labelClassName)}>
        {label}
      </dt>
      <dd
        className={cn(
          valueVariants({ size, tone, monospace, orientation }),
          copyTarget != null && 'inline-flex items-center gap-1.5 min-w-0',
          valueClassName,
        )}
        title={valueTitle}
      >
        {value}
        {copyTarget != null && (
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'shrink-0 inline-flex items-center justify-center h-5 w-5 rounded text-text-tertiary',
              'opacity-0 group-hover/kv:opacity-100 focus-visible:opacity-100',
              'hover:text-text-primary hover:bg-bg-elevated transition-opacity',
            )}
            aria-label={copied ? 'Copied' : `Copy ${label}`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        )}
      </dd>
    </dl>
  )
}
