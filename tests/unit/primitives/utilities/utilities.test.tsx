import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { ResizeHandle } from '../../../../src/renderer/src/primitives/utilities/ResizeHandle'

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
    expect(container.firstChild).toHaveClass('transition-colors')
  })
})
