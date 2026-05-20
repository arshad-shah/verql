import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles,
  FloatingPortal,
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
  searchable?: boolean
  searchPlaceholder?: string
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
  searchable = false,
  searchPlaceholder = 'Search\u2026',
  size,
  className,
  'aria-label': ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [searchQuery, setSearchQuery] = useState('')
  const typeaheadRef = useRef('')
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const listRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const allOptions = useMemo(() => flattenOptions(options), [options])
  const selectedOption = allOptions.find((o) => o.value === value)

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return allOptions
    const q = searchQuery.toLowerCase()
    return allOptions.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  }, [allOptions, searchQuery, searchable])

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
        apply({ rects, elements, availableHeight }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
            maxWidth: `${Math.max(rects.reference.width, 320)}px`,
            maxHeight: `${Math.min(availableHeight, 320)}px`,
          })
        },
        padding: 8,
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

  const visibleOptions = searchable ? filteredOptions : allOptions

  const getEnabledIndices = useCallback(() => {
    return visibleOptions.reduce<number[]>((acc, opt, i) => {
      if (!opt.disabled) acc.push(i)
      return acc
    }, [])
  }, [visibleOptions])

  useEffect(() => {
    if (isOpen) {
      const selectedIdx = visibleOptions.findIndex((o) => o.value === value)
      if (selectedIdx >= 0 && !visibleOptions[selectedIdx].disabled) {
        setFocusedIndex(selectedIdx)
      } else {
        const enabled = getEnabledIndices()
        setFocusedIndex(enabled[0] ?? -1)
      }
      if (searchable) {
        requestAnimationFrame(() => searchInputRef.current?.focus())
      }
    } else {
      setFocusedIndex(-1)
      setSearchQuery('')
    }
  }, [isOpen, visibleOptions, value, getEnabledIndices, searchable])

  // Re-focus first enabled option when search query changes
  useEffect(() => {
    if (isOpen && searchable && searchQuery) {
      const enabled = getEnabledIndices()
      setFocusedIndex(enabled[0] ?? -1)
    }
  }, [searchQuery, isOpen, searchable, getEnabledIndices])

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
      const currentEnabledPos = enabled.indexOf(focusedIndex)

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          if (enabled.length === 0) break
          const next = currentEnabledPos < enabled.length - 1 ? enabled[currentEnabledPos + 1] : enabled[0]
          setFocusedIndex(next)
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          if (enabled.length === 0) break
          const prev = currentEnabledPos > 0 ? enabled[currentEnabledPos - 1] : enabled[enabled.length - 1]
          setFocusedIndex(prev)
          break
        }
        case 'Home': {
          e.preventDefault()
          setFocusedIndex(enabled[0] ?? -1)
          break
        }
        case 'End': {
          e.preventDefault()
          setFocusedIndex(enabled[enabled.length - 1] ?? -1)
          break
        }
        case 'Enter': {
          e.preventDefault()
          if (focusedIndex >= 0 && visibleOptions[focusedIndex]) {
            selectOption(visibleOptions[focusedIndex])
          }
          break
        }
        case ' ': {
          // Allow space in search input for typing
          if (searchable) break
          e.preventDefault()
          if (focusedIndex >= 0 && visibleOptions[focusedIndex]) {
            selectOption(visibleOptions[focusedIndex])
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
          // Only do typeahead when not searchable (search input handles its own typing)
          if (!searchable && e.key.length === 1) {
            e.preventDefault()
            typeaheadRef.current += e.key.toLowerCase()
            clearTimeout(typeaheadTimerRef.current)
            typeaheadTimerRef.current = setTimeout(() => {
              typeaheadRef.current = ''
            }, TYPEAHEAD_RESET_MS)

            const match = visibleOptions.findIndex(
              (opt, i) => !opt.disabled && opt.label.toLowerCase().startsWith(typeaheadRef.current) && enabled.includes(i)
            )
            if (match >= 0) setFocusedIndex(match)
          }
        }
      }
    },
    [isOpen, focusedIndex, visibleOptions, getEnabledIndices, selectOption, searchable]
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

    // When searchable, use the flat filtered list (groups are flattened by filter)
    if (searchable && searchQuery) {
      for (let i = 0; i < filteredOptions.length; i++) {
        items.push({ kind: 'option', option: filteredOptions[i], flatIndex: i })
      }
      return items
    }

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
  }, [options, searchable, searchQuery, filteredOptions])

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
        <FloatingPortal>
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
              className={cn(
                'outline-none',
                'bg-bg-elevated border border-border-default rounded-lg',
                'shadow-dropdown',
              )}
              style={transitionStyles}
            >
              {searchable && (
                <div className="px-2 pt-2 pb-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={searchPlaceholder}
                    className="w-full h-7 px-2 text-xs rounded bg-bg-tertiary border border-border-default text-text-primary placeholder:text-text-tertiary outline-none focus:shadow-[var(--shadow-focus-glow)]"
                    aria-label="Filter options"
                  />
                </div>
              )}
              <div
                ref={listRef}
                className="overflow-auto max-h-60 py-1"
              >
                {renderItems.length === 0 && searchable && searchQuery && (
                  <div className="px-3 py-2 text-xs text-text-tertiary">No matches</div>
                )}
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
          </div>
        </FloatingPortal>
      )}
    </div>
  )
}

Select.displayName = 'Select'
