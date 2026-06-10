import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React, { createRef } from 'react'
import { Input } from '../../../../src/renderer/src/primitives/forms/Input'
import { Textarea } from '../../../../src/renderer/src/primitives/forms/Textarea'
import { Label } from '../../../../src/renderer/src/primitives/forms/Label'
import { FormField } from '../../../../src/renderer/src/primitives/forms/FormField'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Type here" />)
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument()
  })

  it('renders as input type text by default', () => {
    const { container } = render(<Input />)
    expect(container.querySelector('input')).toBeInTheDocument()
  })

  // Input now wraps Cynosure's component, which owns its styling. The
  // wrapper's contract is the size fold (xs/sm→sm, md→md, lg/xl→lg) and the
  // error→invalid mapping, asserted via the Cynosure size-bearing element and
  // semantic attributes rather than the removed Tailwind classes.
  const sizeClass = (size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl') =>
    render(<Input size={size} />).container.querySelector('span')?.className

  it('defaults to the sm size', () => {
    expect(sizeClass(undefined)).toBe(sizeClass('sm'))
  })

  it('folds xs onto the same Cynosure size as sm', () => {
    expect(sizeClass('xs')).toBe(sizeClass('sm'))
  })

  it('folds xl onto the same Cynosure size as lg', () => {
    expect(sizeClass('xl')).toBe(sizeClass('lg'))
  })

  it('maps md to a size distinct from sm and lg', () => {
    expect(sizeClass('md')).not.toBe(sizeClass('sm'))
    expect(sizeClass('md')).not.toBe(sizeClass('lg'))
  })

  it('marks the input invalid when error is true', () => {
    const { container } = render(<Input error />)
    expect(container.querySelector('input')).toHaveAttribute('aria-invalid', 'true')
  })

  it('is not invalid by default', () => {
    const { container } = render(<Input />)
    expect(container.querySelector('input')).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('is disabled when disabled prop is set', () => {
    render(<Input disabled placeholder="disabled" />)
    expect(screen.getByPlaceholderText('disabled')).toBeDisabled()
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.nodeName).toBe('INPUT')
  })
})

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea placeholder="Type here" />)
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument()
  })

  it('is a textarea element', () => {
    const { container } = render(<Textarea />)
    expect(container.querySelector('textarea')).toBeInTheDocument()
  })

  it('applies error border when error is true', () => {
    const { container } = render(<Textarea error />)
    expect(container.firstChild).toHaveClass('border-error')
  })

  it('applies resize-y class', () => {
    const { container } = render(<Textarea />)
    expect(container.firstChild).toHaveClass('resize-y')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.nodeName).toBe('TEXTAREA')
  })
})

describe('Label', () => {
  it('renders a label element', () => {
    const { container } = render(<Label>My Label</Label>)
    expect(container.querySelector('label')).toBeInTheDocument()
  })

  it('renders children text', () => {
    render(<Label>Username</Label>)
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('applies text styling classes', () => {
    const { container } = render(<Label>Label</Label>)
    expect(container.firstChild).toHaveClass('text-sm')
    expect(container.firstChild).toHaveClass('font-medium')
    expect(container.firstChild).toHaveClass('text-text-primary')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLLabelElement>()
    render(<Label ref={ref}>Label</Label>)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.nodeName).toBe('LABEL')
  })
})

describe('FormField', () => {
  it('renders label and children', () => {
    render(
      <FormField label="Email">
        <Input placeholder="Enter email" />
      </FormField>
    )
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(
      <FormField label="Email" error="Invalid email">
        <Input />
      </FormField>
    )
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
  })

  it('renders hint message', () => {
    render(
      <FormField label="Password" hint="Must be at least 8 characters">
        <Input />
      </FormField>
    )
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument()
  })

  it('connects label htmlFor to input id', () => {
    const { container } = render(
      <FormField label="Name">
        <Input />
      </FormField>
    )
    const label = container.querySelector('label')
    const input = container.querySelector('input')
    expect(label?.htmlFor).toBeTruthy()
    expect(label?.htmlFor).toBe(input?.id)
  })
})
