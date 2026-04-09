import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

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
          <div className="absolute top-full left-0 mt-1 z-50 rounded-md border border-border-default bg-bg-secondary shadow-[var(--shadow-dropdown)] p-3 w-[200px]">
            <input
              type="color"
              value={isValidHex(currentValue) ? currentValue : defaultValue}
              onChange={(e) => setValue(e.target.value)}
              className="w-full h-32 rounded border-0 cursor-pointer bg-transparent"
            />
            {presets && presets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {presets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { setValue(color); setIsOpen(false) }}
                    className={cn(
                      'w-6 h-6 rounded border transition-all',
                      currentValue === color ? 'border-accent scale-110' : 'border-border-default hover:scale-110'
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

ColorInput.displayName = 'ColorInput'
