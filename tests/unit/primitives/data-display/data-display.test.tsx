import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Badge } from '../../../../src/renderer/src/primitives/data-display/Badge'
import { Tag } from '../../../../src/renderer/src/primitives/data-display/Tag'
import { Avatar } from '../../../../src/renderer/src/primitives/data-display/Avatar'
import { Skeleton } from '../../../../src/renderer/src/primitives/data-display/Skeleton'
import { EmptyState } from '../../../../src/renderer/src/primitives/data-display/EmptyState'
import { KeyValue } from '../../../../src/renderer/src/primitives/data-display/KeyValue'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies default variant classes', () => {
    const { container } = render(<Badge>Default</Badge>)
    expect(container.firstChild).toHaveClass('bg-bg-elevated')
    expect(container.firstChild).toHaveClass('text-text-secondary')
  })

  it('applies accent variant classes', () => {
    const { container } = render(<Badge variant="accent">Accent</Badge>)
    expect(container.firstChild).toHaveClass('text-accent-hover')
  })

  it('applies success variant classes', () => {
    const { container } = render(<Badge variant="success">Success</Badge>)
    expect(container.firstChild).toHaveClass('text-success')
  })

  it('applies warning variant classes', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>)
    expect(container.firstChild).toHaveClass('text-warning')
  })

  it('applies error variant classes', () => {
    const { container } = render(<Badge variant="error">Error</Badge>)
    expect(container.firstChild).toHaveClass('text-error')
  })

  it('applies info variant classes', () => {
    const { container } = render(<Badge variant="info">Info</Badge>)
    expect(container.firstChild).toHaveClass('text-info')
  })

  it('applies md size by default', () => {
    const { container } = render(<Badge>Default size</Badge>)
    expect(container.firstChild).toHaveClass('px-2')
    expect(container.firstChild).toHaveClass('py-0.5')
    expect(container.firstChild).toHaveClass('text-xs')
  })

  it('applies sm size', () => {
    const { container } = render(<Badge size="sm">Small</Badge>)
    expect(container.firstChild).toHaveClass('px-1.5')
  })

  it('applies lg size', () => {
    const { container } = render(<Badge size="lg">Large</Badge>)
    expect(container.firstChild).toHaveClass('px-2.5')
    expect(container.firstChild).toHaveClass('py-1')
    expect(container.firstChild).toHaveClass('text-sm')
  })

  it('has base classes', () => {
    const { container } = render(<Badge>Base</Badge>)
    expect(container.firstChild).toHaveClass('inline-flex')
    expect(container.firstChild).toHaveClass('items-center')
    expect(container.firstChild).toHaveClass('font-medium')
    expect(container.firstChild).toHaveClass('rounded-full')
  })
})

describe('Tag', () => {
  it('renders children', () => {
    render(<Tag>react</Tag>)
    expect(screen.getByText('react')).toBeInTheDocument()
  })

  it('applies base styling classes', () => {
    const { container } = render(<Tag>tag</Tag>)
    expect(container.firstChild).toHaveClass('inline-flex')
    expect(container.firstChild).toHaveClass('items-center')
    expect(container.firstChild).toHaveClass('text-xs')
    expect(container.firstChild).toHaveClass('rounded')
    expect(container.firstChild).toHaveClass('bg-bg-elevated')
    expect(container.firstChild).toHaveClass('text-text-secondary')
    expect(container.firstChild).toHaveClass('border')
    expect(container.firstChild).toHaveClass('border-border-default')
  })

  it('does not render dismiss button without onDismiss', () => {
    render(<Tag>tag</Tag>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders dismiss button when onDismiss is provided', () => {
    const onDismiss = vi.fn()
    render(<Tag onDismiss={onDismiss}>tag</Tag>)
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    render(<Tag onDismiss={onDismiss}>tag</Tag>)
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

describe('Avatar', () => {
  it('renders initials from single word name', () => {
    render(<Avatar name="Alice" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders initials from two word name (max 2 letters)', () => {
    render(<Avatar name="John Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders initials from three word name (max 2 letters)', () => {
    render(<Avatar name="John Michael Doe" />)
    expect(screen.getByText('JM')).toBeInTheDocument()
  })

  it('renders initials in uppercase', () => {
    render(<Avatar name="alice bob" />)
    expect(screen.getByText('AB')).toBeInTheDocument()
  })

  it('renders img element when src is provided', () => {
    render(<Avatar name="Alice" src="https://example.com/avatar.jpg" />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('applies md size by default', () => {
    const { container } = render(<Avatar name="Alice" />)
    expect(container.firstChild).toHaveClass('h-8')
    expect(container.firstChild).toHaveClass('w-8')
  })

  it('applies xs size', () => {
    const { container } = render(<Avatar name="Alice" size="xs" />)
    expect(container.firstChild).toHaveClass('h-6')
    expect(container.firstChild).toHaveClass('w-6')
  })

  it('applies xl size', () => {
    const { container } = render(<Avatar name="Alice" size="xl" />)
    expect(container.firstChild).toHaveClass('h-10')
    expect(container.firstChild).toHaveClass('w-10')
  })

  it('has base classes', () => {
    const { container } = render(<Avatar name="Alice" />)
    expect(container.firstChild).toHaveClass('inline-flex')
    expect(container.firstChild).toHaveClass('items-center')
    expect(container.firstChild).toHaveClass('justify-center')
    expect(container.firstChild).toHaveClass('rounded-full')
  })
})

describe('Skeleton', () => {
  it('renders an element', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('has animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('has base styling classes', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('bg-bg-elevated')
    expect(container.firstChild).toHaveClass('rounded-md')
    expect(container.firstChild).toHaveClass('h-4')
    expect(container.firstChild).toHaveClass('w-full')
  })

  it('merges custom className', () => {
    const { container } = render(<Skeleton className="h-8 w-32" />)
    expect(container.firstChild).toHaveClass('h-8')
    expect(container.firstChild).toHaveClass('w-32')
  })
})

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No results" />)
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<EmptyState title="No results" description="Try a different search." />)
    expect(screen.getByText('Try a different search.')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<EmptyState title="No results" />)
    expect(screen.queryByText('Try a different search.')).not.toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<EmptyState title="Empty" icon={<span data-testid="icon">icon</span>} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(<EmptyState title="Empty" action={<button>Create new</button>} />)
    expect(screen.getByRole('button', { name: 'Create new' })).toBeInTheDocument()
  })

  it('applies layout classes', () => {
    const { container } = render(<EmptyState title="Empty" />)
    expect(container.firstChild).toHaveClass('flex')
    expect(container.firstChild).toHaveClass('flex-col')
    expect(container.firstChild).toHaveClass('items-center')
    expect(container.firstChild).toHaveClass('justify-center')
    expect(container.firstChild).toHaveClass('py-12')
    expect(container.firstChild).toHaveClass('text-center')
  })
})

describe('KeyValue', () => {
  it('renders label', () => {
    render(<KeyValue label="Version" value="1.0.0" />)
    expect(screen.getByText('Version')).toBeInTheDocument()
  })

  it('renders value', () => {
    render(<KeyValue label="Version" value="1.0.0" />)
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
  })

  it('renders label in dt element', () => {
    const { container } = render(<KeyValue label="Version" value="1.0.0" />)
    expect(container.querySelector('dt')).toBeInTheDocument()
    expect(container.querySelector('dt')).toHaveTextContent('Version')
  })

  it('renders value in dd element', () => {
    const { container } = render(<KeyValue label="Version" value="1.0.0" />)
    expect(container.querySelector('dd')).toBeInTheDocument()
    expect(container.querySelector('dd')).toHaveTextContent('1.0.0')
  })

  it('renders ReactNode as value', () => {
    render(<KeyValue label="Status" value={<span data-testid="status-badge">Active</span>} />)
    expect(screen.getByTestId('status-badge')).toBeInTheDocument()
  })

  it('applies label text classes', () => {
    const { container } = render(<KeyValue label="Version" value="1.0.0" />)
    const dt = container.querySelector('dt')
    expect(dt).toHaveClass('text-xs')
    expect(dt).toHaveClass('text-text-secondary')
  })

  it('applies value text classes', () => {
    const { container } = render(<KeyValue label="Version" value="1.0.0" />)
    const dd = container.querySelector('dd')
    expect(dd).toHaveClass('text-sm')
    expect(dd).toHaveClass('text-text-primary')
  })
})
