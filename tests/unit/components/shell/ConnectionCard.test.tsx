import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ConnectionCard } from '../../../../src/renderer/src/components/shell/ConnectionCard'

describe('ConnectionCard', () => {
  const connected = {
    isConnected: true,
    isError: false,
    dbType: 'postgresql' as const,
    dbName: 'my_app_db',
    schema: 'public',
    isOpen: false,
    onClick: vi.fn(),
  }

  it('renders DB type abbreviation for postgresql', () => {
    render(<ConnectionCard {...connected} />)
    expect(screen.getByText('PG')).toBeInTheDocument()
  })

  it('renders database name', () => {
    render(<ConnectionCard {...connected} />)
    expect(screen.getByText('my_app_db')).toBeInTheDocument()
  })

  it('renders schema with / prefix', () => {
    render(<ConnectionCard {...connected} />)
    expect(screen.getByText('/ public')).toBeInTheDocument()
  })

  it('renders "No connection" when disconnected', () => {
    render(
      <ConnectionCard isConnected={false} isError={false} dbType={null} dbName={null} schema={null} isOpen={false} onClick={vi.fn()} />
    )
    expect(screen.getByText('No connection')).toBeInTheDocument()
  })

  it('renders "Connection lost" in error state', () => {
    render(<ConnectionCard {...connected} isError={true} />)
    expect(screen.getByText('Connection lost')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handler = vi.fn()
    render(<ConnectionCard {...connected} onClick={handler} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('shows mysql abbreviation', () => {
    render(<ConnectionCard {...connected} dbType="mysql" />)
    expect(screen.getByText('MY')).toBeInTheDocument()
  })

  it('shows sqlite abbreviation', () => {
    render(<ConnectionCard {...connected} dbType="sqlite" />)
    expect(screen.getByText('SL')).toBeInTheDocument()
  })
})
