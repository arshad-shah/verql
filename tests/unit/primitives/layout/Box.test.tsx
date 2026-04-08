import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React, { createRef } from 'react'
import { Box } from '../../../../src/renderer/src/primitives/layout/Box'

describe('Box', () => {
  it('renders children', () => {
    render(<Box>hello</Box>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('renders as div by default', () => {
    const { container } = render(<Box>content</Box>)
    expect(container.firstChild?.nodeName).toBe('DIV')
  })

  it('renders as a custom element via as prop', () => {
    const { container } = render(<Box as="section">content</Box>)
    expect(container.firstChild?.nodeName).toBe('SECTION')
  })

  it('applies padding classes', () => {
    const { container } = render(<Box padding="md">content</Box>)
    expect(container.firstChild).toHaveClass('p-3')
  })

  it('applies paddingX classes', () => {
    const { container } = render(<Box paddingX="lg">content</Box>)
    expect(container.firstChild).toHaveClass('px-4')
  })

  it('applies paddingY classes', () => {
    const { container } = render(<Box paddingY="sm">content</Box>)
    expect(container.firstChild).toHaveClass('py-2')
  })

  it('applies radius classes', () => {
    const { container } = render(<Box radius="full">content</Box>)
    expect(container.firstChild).toHaveClass('rounded-full')
  })

  it('merges custom className', () => {
    const { container } = render(<Box className="text-red-500">content</Box>)
    expect(container.firstChild).toHaveClass('text-red-500')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Box ref={ref}>content</Box>)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.nodeName).toBe('DIV')
  })

  it('spreads additional props', () => {
    render(<Box data-testid="my-box">content</Box>)
    expect(screen.getByTestId('my-box')).toBeInTheDocument()
  })
})
