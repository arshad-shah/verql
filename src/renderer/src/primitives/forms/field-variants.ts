/**
 * Shared sizing foundation for the form-field primitives (Input, NumberInput,
 * PasswordInput, FilePathInput, FileContentInput, DatePicker, Textarea).
 *
 * Every field tier maps to three control-local CSS vars sourced from the
 * `--field-*` density tokens in `styles/globals.css`. A single `[data-density]`
 * flip on `<html>` (wired in ThemeProvider) rescales every field at once — no
 * per-component density branching. Radius mapping: `xs,sm → r-sm`,
 * `md,lg → r-md`, `xl → r-lg`.
 *
 * Base classes consume the locals via:
 *   h-[var(--field-ctl-h)] text-[length:var(--field-ctl-fs)]
 *   rounded-[var(--field-ctl-r)] px-[var(--field-px)]
 * Note the `length:` hint on the font-size arbitrary value.
 */
import { cva } from 'class-variance-authority'

export const fieldSizeVariants = {
  xs: '[--field-ctl-h:var(--field-h-xs)] [--field-ctl-fs:var(--field-fs-xs)] [--field-ctl-r:var(--field-r-sm)]',
  sm: '[--field-ctl-h:var(--field-h-sm)] [--field-ctl-fs:var(--field-fs-sm)] [--field-ctl-r:var(--field-r-sm)]',
  md: '[--field-ctl-h:var(--field-h-md)] [--field-ctl-fs:var(--field-fs-md)] [--field-ctl-r:var(--field-r-md)]',
  lg: '[--field-ctl-h:var(--field-h-lg)] [--field-ctl-fs:var(--field-fs-lg)] [--field-ctl-r:var(--field-r-md)]',
  xl: '[--field-ctl-h:var(--field-h-xl)] [--field-ctl-fs:var(--field-fs-xl)] [--field-ctl-r:var(--field-r-lg)]',
} as const

/** The Verql input surface: themed gradient over `--color-bg-tertiary` + inset shadow. */
export const fieldSurface =
  'bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] shadow-[var(--shadow-input-inset)]'

/**
 * Single-line "row" shell shared by FilePathInput and FileContentInput's browse
 * row: a horizontal flex on the input surface, sized by density. Border colour
 * is applied per-state by the consumer (idle / has-value / drag-over), so it is
 * intentionally left off here.
 */
export const fieldRowVariants = cva(
  [
    'flex items-center gap-[var(--field-gap)] border text-text-primary',
    fieldSurface,
    'h-[var(--field-ctl-h)] px-[var(--field-px)] text-[length:var(--field-ctl-fs)] rounded-[var(--field-ctl-r)]',
    'transition-all duration-[var(--transition-fast)] motion-reduce:transition-none',
  ].join(' '),
  {
    variants: { size: fieldSizeVariants },
    defaultVariants: { size: 'md' },
  }
)
