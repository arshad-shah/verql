import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React, { createRef } from 'react'
import { Card } from '../../../../src/renderer/src/primitives/surfaces/Card'
import { Panel } from '../../../../src/renderer/src/primitives/surfaces/Panel'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>card content</Card>)
    expect(screen.getByText('card content')).toBeInTheDocument()
  })

  it('has border and rounded-lg classes', () => {
    const { container } = render(<Card>content</Card>)
    expect(container.firstChild).toHaveClass('border')
    expect(container.firstChild).toHaveClass('rounded-lg')
  })

  it('applies default md padding variant', () => {
    const { container } = render(<Card>content</Card>)
    expect(container.firstChild).toHaveClass('p-3')
  })

  it('applies none padding variant', () => {
    const { container } = render(<Card padding="none">content</Card>)
    expect(container.firstChild).not.toHaveClass('p-3')
  })

  it('applies sm padding variant', () => {
    const { container } = render(<Card padding="sm">content</Card>)
    expect(container.firstChild).toHaveClass('p-2')
  })

  it('applies lg padding variant', () => {
    const { container } = render(<Card padding="lg">content</Card>)
    expect(container.firstChild).toHaveClass('p-4')
  })

  it('applies xl padding variant', () => {
    const { container } = render(<Card padding="xl">content</Card>)
    expect(container.firstChild).toHaveClass('p-6')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Card ref={ref}>content</Card>)
    expect(ref.current).not.toBeNull()
  })

  it('merges custom className', () => {
    const { container } = render(<Card className="custom-class">content</Card>)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('Panel', () => {
  it('renders children', () => {
    render(<Panel>panel content</Panel>)
    expect(screen.getByText('panel content')).toBeInTheDocument()
  })

  it('has bg-bg-secondary class', () => {
    const { container } = render(<Panel>content</Panel>)
    expect(container.firstChild).toHaveClass('bg-bg-secondary')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Panel ref={ref}>content</Panel>)
    expect(ref.current).not.toBeNull()
  })

  it('merges custom className', () => {
    const { container } = render(<Panel className="extra">content</Panel>)
    expect(container.firstChild).toHaveClass('extra')
  })
})
