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

  it('applies md size by default', () => {
    const { container } = render(<Input />)
    expect(container.firstChild).toHaveClass('h-9')
  })

  it('applies xs size', () => {
    const { container } = render(<Input size="xs" />)
    expect(container.firstChild).toHaveClass('h-7')
  })

  it('applies sm size', () => {
    const { container } = render(<Input size="sm" />)
    expect(container.firstChild).toHaveClass('h-8')
  })

  it('applies lg size', () => {
    const { container } = render(<Input size="lg" />)
    expect(container.firstChild).toHaveClass('h-10')
  })

  it('applies xl size', () => {
    const { container } = render(<Input size="xl" />)
    expect(container.firstChild).toHaveClass('h-12')
  })

  it('applies error border when error is true', () => {
    const { container } = render(<Input error />)
    expect(container.firstChild).toHaveClass('border-error')
  })

  it('applies default border when no error', () => {
    const { container } = render(<Input />)
    expect(container.firstChild).toHaveClass('border-border-default')
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
