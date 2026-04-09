import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles,
  offset,
  flip,
  shift,
  autoUpdate,
  size as floatingSize,
} from '@floating-ui/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../utils/cn'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type SelectGroup = {
  label: string
  options: SelectOption[]
}

export type SelectItem = SelectOption | SelectGroup

function isGroup(item: SelectItem): item is SelectGroup {
  return 'options' in item
}

function flattenOptions(items: SelectItem[]): SelectOption[] {
  const result: SelectOption[] = []
  for (const item of items) {
    if (isGroup(item)) {
      result.push(...item.options)
    } else {
      result.push(item)
    }
  }
  return result
}

/* ------------------------------------------------------------------ */
/*  Trigger variants (matches Input sizing)                            */
/* ------------------------------------------------------------------ */

const triggerVariants = cva(
  'w-full flex items-center justify-between gap-2 border border-border-default bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-(--transition-fast) focus:outline-none focus:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] hover:border-border-strong disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      size: {
        xs: 'h-7 px-2 text-xs rounded',
        sm: 'h-8 px-2.5 text-xs rounded',
        md: 'h-9 px-3 text-sm rounded-md',
        lg: 'h-10 px-4 text-sm rounded-md',
        xl: 'h-12 px-5 text-base rounded-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface SelectProps extends VariantProps<typeof triggerVariants> {
  id?: string
  value: string
  onChange: (value: string) => void
  options: SelectItem[]
  renderOption?: (option: SelectOption, state: { selected: boolean; focused: boolean }) => React.ReactNode
  renderValue?: (option: SelectOption | undefined) => React.ReactNode
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const TYPEAHEAD_RESET_MS = 500

export function Select({
  id,
  value,
  onChange,
  options,
  renderOption,
  renderValue,
  placeholder = 'Select\u2026',
  disabled = false,
  size,
  className,
  'aria-label': ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const typeaheadRef = useRef('')
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const listRef = useRef<HTMLDivElement>(null)

  const allOptions = useMemo(() => flattenOptions(options), [options])
  const selectedOption = allOptions.find((o) => o.value === value)

  /* ---- floating-ui ---- */

  const { refs, floatingStyles, context } = useFloating({
    placement: 'bottom-start',
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      floatingSize({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
          })
        },
      }),
    ],
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'listbox' })

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: { open: 150, close: 100 },
    initial: { opacity: 0, transform: 'scaleY(0.95)' },
    common: { transformOrigin: 'top', transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    open: { opacity: 1, transform: 'scaleY(1)' },
    close: { opacity: 0, transform: 'scaleY(0.95)' },
  })

  /* ---- Focus management ---- */

  const getEnabledIndices = useCallback(() => {
    return allOptions.reduce<number[]>((acc, opt, i) => {
      if (!opt.disabled) acc.push(i)
      return acc
    }, [])
  }, [allOptions])

  useEffect(() => {
    if (isOpen) {
      const selectedIdx = allOptions.findIndex((o) => o.value === value)
      if (selectedIdx >= 0 && !allOptions[selectedIdx].disabled) {
        setFocusedIndex(selectedIdx)
      } else {
        const enabled = getEnabledIndices()
        setFocusedIndex(enabled[0] ?? -1)
      }
    } else {
      setFocusedIndex(-1)
    }
  }, [isOpen, allOptions, value, getEnabledIndices])

  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return
    const el = listRef.current.querySelector(`[data-option-index="${focusedIndex}"]`)
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex])

  /* ---- Selection ---- */

  const selectOption = useCallback(
    (opt: SelectOption) => {
      if (opt.disabled) return
      onChange(opt.value)
      setIsOpen(false)
    },
    [onChange]
  )

  /* ---- Keyboard ---- */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setIsOpen(true)
        }
        return
      }

      const enabled = getEnabledIndices()
      if (enabled.length === 0) return

      const currentEnabledPos = enabled.indexOf(focusedIndex)

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          const next = currentEnabledPos < enabled.length - 1 ? enabled[currentEnabledPos + 1] : enabled[0]
          setFocusedIndex(next)
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const prev = currentEnabledPos > 0 ? enabled[currentEnabledPos - 1] : enabled[enabled.length - 1]
          setFocusedIndex(prev)
          break
        }
        case 'Home': {
          e.preventDefault()
          setFocusedIndex(enabled[0])
          break
        }
        case 'End': {
          e.preventDefault()
          setFocusedIndex(enabled[enabled.length - 1])
          break
        }
        case 'Enter':
        case ' ': {
          e.preventDefault()
          if (focusedIndex >= 0 && allOptions[focusedIndex]) {
            selectOption(allOptions[focusedIndex])
          }
          break
        }
        case 'Escape': {
          e.preventDefault()
          setIsOpen(false)
          break
        }
        case 'Tab': {
          setIsOpen(false)
          break
        }
        default: {
          if (e.key.length === 1) {
            e.preventDefault()
            typeaheadRef.current += e.key.toLowerCase()
            clearTimeout(typeaheadTimerRef.current)
            typeaheadTimerRef.current = setTimeout(() => {
              typeaheadRef.current = ''
            }, TYPEAHEAD_RESET_MS)

            const match = allOptions.findIndex(
              (opt, i) => !opt.disabled && opt.label.toLowerCase().startsWith(typeaheadRef.current) && enabled.includes(i)
            )
            if (match >= 0) setFocusedIndex(match)
          }
        }
      }
    },
    [isOpen, focusedIndex, allOptions, getEnabledIndices, selectOption]
  )

  /* ---- Render helpers ---- */

  function renderTriggerContent() {
    if (renderValue) return renderValue(selectedOption)
    if (selectedOption) return <span className="truncate">{selectedOption.label}</span>
    return <span className="truncate text-text-muted">{placeholder}</span>
  }

  function renderOptionContent(opt: SelectOption, state: { selected: boolean; focused: boolean }) {
    if (renderOption) return renderOption(opt, state)
    return (
      <>
        <span className="truncate flex-1">{opt.label}</span>
        {state.selected && <Check size={14} className="shrink-0 text-text-accent" />}
      </>
    )
  }

  /* ---- Build flat render list with group headers ---- */

  type RenderItem =
    | { kind: 'option'; option: SelectOption; flatIndex: number }
    | { kind: 'group'; label: string }

  const renderItems = useMemo(() => {
    const items: RenderItem[] = []
    let flatIdx = 0
    for (const item of options) {
      if (isGroup(item)) {
        items.push({ kind: 'group', label: item.label })
        for (const opt of item.options) {
          items.push({ kind: 'option', option: opt, flatIndex: flatIdx++ })
        }
      } else {
        items.push({ kind: 'option', option: item, flatIndex: flatIdx++ })
      }
    }
    return items
  }, [options])

  /* ---- JSX ---- */

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        id={id}
        ref={refs.setReference}
        disabled={disabled}
        className={cn(triggerVariants({ size }))}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        {...getReferenceProps({
          onKeyDown: handleKeyDown,
        })}
      >
        {renderTriggerContent()}
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-text-muted transition-transform duration-(--transition-fast)',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isMounted && (
        <div
          ref={refs.setFloating}
          style={{ ...floatingStyles, zIndex: 50 }}
          {...getFloatingProps({
            onKeyDown: handleKeyDown,
          })}
          aria-label={ariaLabel}
          aria-activedescendant={focusedIndex >= 0 ? `select-option-${focusedIndex}` : undefined}
        >
          <div
            ref={listRef}
            className={cn(
              'overflow-auto max-h-60 py-1 outline-none',
              'bg-bg-elevated border border-border-default rounded-lg',
              'shadow-dropdown',
            )}
            style={transitionStyles}
          >
            {renderItems.map((item, i) => {
              if (item.kind === 'group') {
                return (
                  <div
                    key={`group-${i}`}
                    className="px-3 pt-2 pb-1 text-xs font-semibold text-text-muted uppercase tracking-wider select-none"
                  >
                    {item.label}
                  </div>
                )
              }

              const { option, flatIndex } = item
              const isSelected = option.value === value
              const isFocused = flatIndex === focusedIndex

              return (
                <div
                  key={option.value}
                  id={`select-option-${flatIndex}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  data-option-index={flatIndex}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors duration-(--transition-fast)',
                    isFocused && 'bg-hover',
                    option.disabled && 'opacity-50 pointer-events-none',
                  )}
                  onPointerMove={() => {
                    if (!option.disabled && focusedIndex !== flatIndex) setFocusedIndex(flatIndex)
                  }}
                  onClick={() => selectOption(option)}
                >
                  {renderOptionContent(option, { selected: isSelected, focused: isFocused })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

Select.displayName = 'Select'
