import React, { forwardRef, useState, useCallback, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const dateInputVariants = cva(
  'flex items-center gap-2 border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus-within:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] border-border-default hover:border-border-strong',
  {
    variants: {
      size: {
        xs: 'h-7 px-2 text-xs rounded',
        sm: 'h-8 px-2 text-xs rounded',
        md: 'h-9 px-3 text-sm rounded-md',
        lg: 'h-10 px-3 text-sm rounded-md',
        xl: 'h-12 px-4 text-base rounded-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDate(s: string): Date | null {
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const d = new Date(+match[1], +match[2] - 1, +match[3])
  return isNaN(d.getTime()) ? null : d
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export interface DatePickerProps extends VariantProps<typeof dateInputVariants> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  min?: string
  max?: string
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value: controlledValue, defaultValue, onChange, min, max, disabled, placeholder = 'YYYY-MM-DD', size, className }, ref) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')
    const [textValue, setTextValue] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const currentValue = isControlled ? controlledValue : internalValue
    const currentDate = parseDate(currentValue) ?? new Date()
    const [viewYear, setViewYear] = useState(currentDate.getFullYear())
    const [viewMonth, setViewMonth] = useState(currentDate.getMonth())

    const setValue = useCallback(
      (v: string) => {
        if (!isControlled) setInternalValue(v)
        onChange?.(v)
      },
      [isControlled, onChange]
    )

    const selectDay = useCallback(
      (day: number) => {
        const d = new Date(viewYear, viewMonth, day)
        setValue(formatDate(d))
        setShowCalendar(false)
      },
      [viewYear, viewMonth, setValue]
    )

    const handleBlur = () => {
      setIsEditing(false)
      const d = parseDate(textValue)
      if (d) setValue(formatDate(d))
    }

    const handleFocus = () => {
      setTextValue(currentValue)
      setIsEditing(true)
    }

    const isDateDisabled = useCallback(
      (day: number) => {
        const dateStr = formatDate(new Date(viewYear, viewMonth, day))
        if (min && dateStr < min) return true
        if (max && dateStr > max) return true
        return false
      },
      [viewYear, viewMonth, min, max]
    )

    useEffect(() => {
      if (!showCalendar) return
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setShowCalendar(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [showCalendar])

    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth)
    const selectedDateStr = currentValue

    const prevMonth = () => {
      if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
      else setViewMonth(viewMonth - 1)
    }
    const nextMonth = () => {
      if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
      else setViewMonth(viewMonth + 1)
    }

    return (
      <div ref={containerRef} className="relative">
        <div className={cn(dateInputVariants({ size }), disabled && 'opacity-50 pointer-events-none', className)}>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowCalendar(!showCalendar)}
            className="text-text-muted hover:text-text-primary transition-colors shrink-0"
            aria-label="Toggle calendar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </button>
          <input
            ref={ref}
            type="text"
            value={isEditing ? textValue : currentValue}
            onChange={(e) => setTextValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 h-full bg-transparent outline-none min-w-0 font-mono text-inherit placeholder:text-text-muted"
          />
        </div>

        {showCalendar && (
          <div className="absolute top-full left-0 mt-1 z-50 rounded-md border border-border-default bg-bg-secondary shadow-[var(--shadow-dropdown)] p-3 w-[260px]">
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={prevMonth} className="p-1 hover:bg-hover rounded text-text-secondary transition-colors" aria-label="Previous month"><ChevronLeft size={14} /></button>
              <span className="text-sm font-medium text-text-primary">{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth} className="p-1 hover:bg-hover rounded text-text-secondary transition-colors" aria-label="Next month"><ChevronRight size={14} /></button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] text-text-muted mb-1">
              {DAY_HEADERS.map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateStr = formatDate(new Date(viewYear, viewMonth, day))
                const isSelected = dateStr === selectedDateStr
                const isToday = dateStr === formatDate(new Date())
                const isDayDisabled = isDateDisabled(day)

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !isDayDisabled && selectDay(day)}
                    disabled={isDayDisabled}
                    className={cn(
                      'h-7 w-7 rounded text-xs transition-colors',
                      isSelected && 'bg-accent text-text-inverse',
                      !isSelected && isToday && 'border border-accent text-accent',
                      !isSelected && !isToday && 'hover:bg-hover text-text-primary',
                      isDayDisabled && 'opacity-30 pointer-events-none'
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => { const today = new Date(); setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); selectDay(today.getDate()) }}
              className="mt-2 w-full text-xs text-accent hover:underline"
            >
              Today
            </button>
          </div>
        )}
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'
