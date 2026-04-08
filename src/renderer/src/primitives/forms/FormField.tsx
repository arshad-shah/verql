import React, { useId } from 'react'
import { Label } from './Label'
import { cn } from '../utils/cn'

export interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  children: React.ReactElement<{ id?: string }>
  className?: string
}

export function FormField({ label, error, hint, children, className }: FormFieldProps) {
  const id = useId()

  const child = React.cloneElement(children, { id })

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      {child}
      {error && (
        <span className="text-xs text-error">{error}</span>
      )}
      {!error && hint && (
        <span className="text-xs text-text-muted">{hint}</span>
      )}
    </div>
  )
}

FormField.displayName = 'FormField'
