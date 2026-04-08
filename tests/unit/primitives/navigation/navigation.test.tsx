import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Tabs } from '../../../../src/renderer/src/primitives/navigation/Tabs'
import { Breadcrumb } from '../../../../src/renderer/src/primitives/navigation/Breadcrumb'
import { Link } from '../../../../src/renderer/src/primitives/navigation/Link'
import { Pagination } from '../../../../src/renderer/src/primitives/navigation/Pagination'

describe('Tabs', () => {
  const tabs = [
    { id: 'tab1', label: 'Overview' },
    { id: 'tab2', label: 'Details' },
    { id: 'tab3', label: 'Settings' },
  ]

  it('renders all tab labels', () => {
    render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => {}} />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('has role="tablist" on container', () => {
    render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => {}} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('has role="tab" on each tab button', () => {
    render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => {}} />)
    const tabButtons = screen.getAllByRole('tab')
    expect(tabButtons).toHaveLength(3)
  })

  it('sets aria-selected="true" on active tab', () => {
    render(<Tabs tabs={tabs} activeTab="tab2" onTabChange={() => {}} />)
    const detailsTab = screen.getByRole('tab', { name: 'Details' })
    expect(detailsTab).toHaveAttribute('aria-selected', 'true')
  })

  it('sets aria-selected="false" on inactive tabs', () => {
    render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => {}} />)
    const detailsTab = screen.getByRole('tab', { name: 'Details' })
    expect(detailsTab).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onTabChange with tab id when clicked', () => {
    const onTabChange = vi.fn()
    render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={onTabChange} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Details' }))
    expect(onTabChange).toHaveBeenCalledWith('tab2')
  })

  it('applies active styles to active tab', () => {
    render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => {}} />)
    const activeTab = screen.getByRole('tab', { name: 'Overview' })
    expect(activeTab).toHaveClass('text-text-primary')
  })

  it('applies inactive styles to inactive tabs', () => {
    render(<Tabs tabs={tabs} activeTab="tab1" onTabChange={() => {}} />)
    const inactiveTab = screen.getByRole('tab', { name: 'Details' })
    expect(inactiveTab).toHaveClass('text-text-secondary')
  })
})

describe('Breadcrumb', () => {
  const items = [
    { label: 'Home', onClick: vi.fn() },
    { label: 'Products', onClick: vi.fn() },
    { label: 'Details' },
  ]

  it('renders all item labels', () => {
    render(<Breadcrumb items={items} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
  })

  it('renders nav with aria-label="Breadcrumb"', () => {
    render(<Breadcrumb items={items} />)
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
  })

  it('renders separators between items', () => {
    const { container } = render(<Breadcrumb items={items} />)
    const separators = container.querySelectorAll('[aria-hidden="true"]')
    expect(separators.length).toBeGreaterThan(0)
  })

  it('renders clickable items as buttons', () => {
    render(<Breadcrumb items={items} />)
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument()
  })

  it('renders last item as non-interactive text', () => {
    render(<Breadcrumb items={items} />)
    const lastItem = screen.getByText('Details')
    expect(lastItem.tagName).not.toBe('BUTTON')
  })

  it('calls onClick when clickable item is clicked', () => {
    const onClick = vi.fn()
    render(<Breadcrumb items={[{ label: 'Home', onClick }, { label: 'Current' }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Home' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies text-text-primary to last item', () => {
    render(<Breadcrumb items={items} />)
    const lastItem = screen.getByText('Details')
    expect(lastItem).toHaveClass('text-text-primary')
  })
})

describe('Link', () => {
  it('renders an anchor element', () => {
    render(<Link href="https://example.com">Visit site</Link>)
    expect(screen.getByRole('link', { name: 'Visit site' })).toBeInTheDocument()
  })

  it('passes href to anchor', () => {
    render(<Link href="https://example.com">Visit site</Link>)
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com')
  })

  it('applies accent color classes', () => {
    const { container } = render(<Link href="#">Link</Link>)
    expect(container.firstChild).toHaveClass('text-accent')
  })

  it('applies text-sm class', () => {
    const { container } = render(<Link href="#">Link</Link>)
    expect(container.firstChild).toHaveClass('text-sm')
  })

  it('merges custom className', () => {
    const { container } = render(<Link href="#" className="custom">Link</Link>)
    expect(container.firstChild).toHaveClass('custom')
  })

  it('forwards ref', () => {
    const ref = React.createRef<HTMLAnchorElement>()
    render(<Link href="#" ref={ref}>Link</Link>)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe('A')
  })

  it('passes other anchor props', () => {
    render(<Link href="#" target="_blank" rel="noopener noreferrer">External</Link>)
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank')
  })
})

describe('Pagination', () => {
  it('renders page info as "page / totalPages"', () => {
    render(<Pagination page={3} totalPages={10} onPageChange={() => {}} />)
    expect(screen.getByText('3 / 10')).toBeInTheDocument()
  })

  it('renders nav with aria-label="Pagination"', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
  })

  it('renders Previous button', () => {
    render(<Pagination page={3} totalPages={10} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument()
  })

  it('renders Next button', () => {
    render(<Pagination page={3} totalPages={10} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument()
  })

  it('calls onPageChange with page - 1 when Previous clicked', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={3} totalPages={10} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with page + 1 when Next clicked', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={3} totalPages={10} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('disables Previous button on first page', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  })

  it('disables Next button on last page', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('enables Previous button when not on first page', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Previous page' })).not.toBeDisabled()
  })

  it('enables Next button when not on last page', () => {
    render(<Pagination page={4} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Next page' })).not.toBeDisabled()
  })
})
