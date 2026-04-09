import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { TreeItem } from '../../../../src/renderer/src/primitives/data-display/TreeItem'

describe('TreeItem', () => {
  it('renders label text', () => {
    render(<TreeItem label="users" />)
    expect(screen.getByText('users')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<TreeItem label="users" icon={<span data-testid="icon">T</span>} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders meta when provided', () => {
    render(<TreeItem label="users" meta={<span>1.2k</span>} />)
    expect(screen.getByText('1.2k')).toBeInTheDocument()
  })

  it('renders actions when provided', () => {
    render(<TreeItem label="users" actions={<button>Menu</button>} />)
    expect(screen.getByText('Menu')).toBeInTheDocument()
  })

  it('indents based on depth', () => {
    const { container } = render(<TreeItem label="column" depth={2} />)
    const row = container.firstElementChild?.firstElementChild as HTMLElement
    expect(row.style.paddingLeft).toBe('40px') // 8 + 2 * 16
  })

  it('renders chevron when onToggle is provided', () => {
    const { container } = render(<TreeItem label="users" onToggle={() => {}} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders spacer instead of chevron for leaf nodes', () => {
    const { container } = render(<TreeItem label="id" depth={1} />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn()
    render(<TreeItem label="users" onToggle={onToggle} />)
    fireEvent.click(screen.getByText('users'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('renders children when expanded', () => {
    render(
      <TreeItem label="users" expanded={true} onToggle={() => {}}>
        <TreeItem label="id" depth={1} />
      </TreeItem>
    )
    expect(screen.getByText('id')).toBeInTheDocument()
  })

  it('hides children when not expanded', () => {
    render(
      <TreeItem label="users" expanded={false} onToggle={() => {}}>
        <TreeItem label="id" depth={1} />
      </TreeItem>
    )
    expect(screen.queryByText('id')).not.toBeInTheDocument()
  })

  it('applies selected styling', () => {
    const { container } = render(<TreeItem label="users" selected />)
    const row = container.firstElementChild?.firstElementChild as HTMLElement
    expect(row.className).toContain('bg-accent')
  })

  it('supports keyboard Enter to toggle', () => {
    const onToggle = vi.fn()
    const { container } = render(<TreeItem label="users" onToggle={onToggle} />)
    const row = container.firstElementChild?.firstElementChild as HTMLElement
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('applies default depth 0 indentation', () => {
    const { container } = render(<TreeItem label="root" />)
    const row = container.firstElementChild?.firstElementChild as HTMLElement
    expect(row.style.paddingLeft).toBe('8px') // 8 + 0 * 16
  })

  it('applies sm size variant', () => {
    const { container } = render(<TreeItem label="users" size="sm" />)
    const row = container.firstElementChild?.firstElementChild as HTMLElement
    expect(row.className).toContain('text-xs')
  })
})
