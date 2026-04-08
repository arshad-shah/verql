import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { VisuallyHidden } from '../../../../src/renderer/src/primitives/utilities/VisuallyHidden'
import { Portal } from '../../../../src/renderer/src/primitives/utilities/Portal'
import { ResizeHandle } from '../../../../src/renderer/src/primitives/utilities/ResizeHandle'

describe('VisuallyHidden', () => {
  it('renders children', () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>)
    expect(screen.getByText('Hidden text')).toBeInTheDocument()
  })

  it('applies sr-only class', () => {
    const { container } = render(<VisuallyHidden>Hidden</VisuallyHidden>)
    expect(container.firstChild).toHaveClass('sr-only')
  })

  it('renders as a span', () => {
    const { container } = render(<VisuallyHidden>Hidden</VisuallyHidden>)
    expect(container.firstChild?.nodeName).toBe('SPAN')
  })
})

describe('Portal', () => {
  it('renders children into document.body by default', () => {
    render(<Portal><div data-testid="portal-child">Portal content</div></Portal>)
    const child = screen.getByTestId('portal-child')
    expect(child).toBeInTheDocument()
    expect(document.body.contains(child)).toBe(true)
  })

  it('renders children into a custom container', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    render(<Portal container={container}><div data-testid="custom-portal">Custom</div></Portal>)
    const child = screen.getByTestId('custom-portal')
    expect(container.contains(child)).toBe(true)
    document.body.removeChild(container)
  })
})

describe('ResizeHandle', () => {
  it('renders with horizontal cursor class for horizontal direction', () => {
    const { container } = render(
      <ResizeHandle direction="horizontal" onResize={() => {}} />
    )
    expect(container.firstChild).toHaveClass('cursor-col-resize')
  })

  it('renders with vertical cursor class for vertical direction', () => {
    const { container } = render(
      <ResizeHandle direction="vertical" onResize={() => {}} />
    )
    expect(container.firstChild).toHaveClass('cursor-row-resize')
  })

  it('has role="separator"', () => {
    render(<ResizeHandle direction="horizontal" onResize={() => {}} />)
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('has tabIndex={0}', () => {
    render(<ResizeHandle direction="horizontal" onResize={() => {}} />)
    expect(screen.getByRole('separator')).toHaveAttribute('tabindex', '0')
  })

  it('has aria-orientation="horizontal" for horizontal direction', () => {
    render(<ResizeHandle direction="horizontal" onResize={() => {}} />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal')
  })

  it('has aria-orientation="vertical" for vertical direction', () => {
    render(<ResizeHandle direction="vertical" onResize={() => {}} />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
  })

  it('calls onResize during pointer drag (horizontal)', () => {
    const onResize = vi.fn()
    render(<ResizeHandle direction="horizontal" onResize={onResize} />)
    const handle = screen.getByRole('separator')

    fireEvent.pointerDown(handle, { clientX: 100, clientY: 0 })
    fireEvent.pointerMove(document, { clientX: 120, clientY: 0 })
    expect(onResize).toHaveBeenCalledWith(20)
  })

  it('calls onResize during pointer drag (vertical)', () => {
    const onResize = vi.fn()
    render(<ResizeHandle direction="vertical" onResize={onResize} />)
    const handle = screen.getByRole('separator')

    fireEvent.pointerDown(handle, { clientX: 0, clientY: 100 })
    fireEvent.pointerMove(document, { clientX: 0, clientY: 130 })
    expect(onResize).toHaveBeenCalledWith(30)
  })

  it('calls onResizeEnd when pointer is released', () => {
    const onResizeEnd = vi.fn()
    render(<ResizeHandle direction="horizontal" onResize={() => {}} onResizeEnd={onResizeEnd} />)
    const handle = screen.getByRole('separator')

    fireEvent.pointerDown(handle, { clientX: 100, clientY: 0 })
    fireEvent.pointerUp(document)
    expect(onResizeEnd).toHaveBeenCalledTimes(1)
  })

  it('has base styling classes', () => {
    const { container } = render(<ResizeHandle direction="horizontal" onResize={() => {}} />)
    expect(container.firstChild).toHaveClass('shrink-0')
    expect(container.firstChild).toHaveClass('bg-transparent')
  })
})
