// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@arshad-shah/cynosure-react/button'
import { IconButton } from '@arshad-shah/cynosure-react/icon-button'

/**
 * Stage 2 of the Cynosure migration replaced Verql's Button/IconButton with
 * Cynosure's (docs/cynosure-migration.md). These tests pin the behaviours the
 * migration relies on, so a Cynosure upgrade that changes them fails loudly
 * here rather than silently breaking call sites.
 */

describe('Cynosure Button (migration contract)', () => {
  it('renders children and fires onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Run</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('defaults to type="button" — forms relying on implicit submit must pass type="submit"', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('honours an explicit type="submit"', () => {
    render(<Button type="submit">Save</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('disables and marks busy when loading (so Cancel-style buttons must NOT use loading)', () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Working</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })

  it('forwards refs to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current?.nodeName).toBe('BUTTON')
  })

  it('accepts the variant/colorScheme pairs the migration maps onto', () => {
    // verql solid → default; outline/ghost → +neutral; error → danger.
    render(
      <>
        <Button>solid</Button>
        <Button variant="outline" colorScheme="neutral">outline</Button>
        <Button variant="ghost" colorScheme="neutral">ghost</Button>
        <Button colorScheme="danger">danger</Button>
        <Button variant="soft" colorScheme="success">soft</Button>
      </>,
    )
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })
})

describe('Cynosure IconButton (migration contract)', () => {
  it('exposes label as the accessible name', () => {
    render(<IconButton label="Close" icon={<svg aria-hidden="true" />} />)
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('supports the bare variant for parent-styled chrome (tab strip, window controls)', () => {
    render(<IconButton variant="bare" label="Close tab" icon={<svg aria-hidden="true" />} className="h-4 w-4" />)
    const btn = screen.getByRole('button', { name: 'Close tab' })
    expect(btn).toHaveClass('h-4')
    expect(btn).toHaveAttribute('type', 'button')
  })
})
