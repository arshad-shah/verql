import React, { forwardRef, useState, useCallback, useRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '../utils/cn'

const tagsInputVariants = cva(
  'flex items-center flex-wrap gap-1 border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus-within:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] border-border-default hover:border-border-strong',
  {
    variants: {
      size: {
        xs: 'min-h-6 px-1.5 py-0.5 text-xs rounded',
        sm: 'min-h-7 px-2 py-0.5 text-xs rounded',
        md: 'min-h-8 px-2 py-1 text-sm rounded-md',
        lg: 'min-h-9 px-3 py-1 text-sm rounded-md',
        xl: 'min-h-10 px-3 py-1.5 text-base rounded-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

export interface TagsInputProps extends VariantProps<typeof tagsInputVariants> {
  value?: string[]
  defaultValue?: string[]
  onChange?: (tags: string[]) => void
  maxTags?: number
  allowDuplicates?: boolean
  validate?: (tag: string) => boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const TagsInput = forwardRef<HTMLInputElement, TagsInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = [],
      onChange,
      maxTags,
      allowDuplicates = false,
      validate,
      disabled,
      placeholder = 'Add tag...',
      size,
      className,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalTags, setInternalTags] = useState(defaultValue)
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const tags = isControlled ? controlledValue : internalTags

    const setTags = useCallback(
      (next: string[]) => {
        if (!isControlled) setInternalTags(next)
        onChange?.(next)
      },
      [isControlled, onChange]
    )

    const addTag = useCallback(
      (raw: string) => {
        const tag = raw.trim()
        if (!tag) return
        if (maxTags && tags.length >= maxTags) return
        if (!allowDuplicates && tags.includes(tag)) return
        if (validate && !validate(tag)) return
        setTags([...tags, tag])
        setInputValue('')
      },
      [tags, maxTags, allowDuplicates, validate, setTags]
    )

    const removeTag = useCallback(
      (index: number) => {
        setTags(tags.filter((_, i) => i !== index))
      },
      [tags, setTags]
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
        e.preventDefault()
        addTag(inputValue)
      } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
        removeTag(tags.length - 1)
      }
    }

    const mergedRef = (el: HTMLInputElement | null) => {
      (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el
    }

    return (
      <div
        className={cn(tagsInputVariants({ size }), disabled && 'opacity-50 pointer-events-none', className)}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded bg-accent-muted text-accent border border-accent/20 px-1.5 py-0.5 text-[11px] leading-tight"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(i)
                }}
                className="opacity-60 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${tag}`}
              >
                <X size={10} />
              </button>
            )}
          </span>
        ))}
        <input
          ref={mergedRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={disabled || (maxTags !== undefined && tags.length >= maxTags)}
          className="flex-1 h-full bg-transparent outline-none min-w-[60px] text-inherit placeholder:text-text-muted"
        />
      </div>
    )
  }
)

TagsInput.displayName = 'TagsInput'
