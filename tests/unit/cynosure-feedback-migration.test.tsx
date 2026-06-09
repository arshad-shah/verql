// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Alert, AlertDescription, AlertTitle } from '@arshad-shah/cynosure-react/alert'
import { Spinner } from '@arshad-shah/cynosure-react/spinner'

/**
 * Stage 3 of the Cynosure migration replaced the Verql feedback primitives
 * (docs/cynosure-migration.md). Pins the behaviours the call-site mapping
 * relies on: Verql `variant="error"` became `status="danger"`, the `title`
 * prop became the AlertTitle slot, and Spinner keeps role="status" + label.
 */

describe('Cynosure Alert (migration contract)', () => {
  it('renders title slot and description for the statuses Verql maps onto', () => {
    render(
      <Alert status="danger">
        <AlertTitle>Connection failed</AlertTitle>
        <AlertDescription>Timeout after 5s</AlertDescription>
      </Alert>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Connection failed')).toBeInTheDocument()
    expect(screen.getByText('Timeout after 5s')).toBeInTheDocument()
  })

  it('uses a polite status role for non-interruptive statuses', () => {
    render(
      <Alert status="success">
        <AlertDescription>Connected</AlertDescription>
      </Alert>,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('supports closable + onClose (replaces Verql onClose)', () => {
    const onClose = vi.fn()
    render(
      <Alert status="info" closable onClose={onClose} closeLabel="Dismiss">
        <AlertDescription>Heads up</AlertDescription>
      </Alert>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('Cynosure Spinner (migration contract)', () => {
  it('exposes role="status" with the given label', () => {
    render(<Spinner label="Loading plugins" />)
    expect(screen.getByRole('status', { name: 'Loading plugins' })).toBeInTheDocument()
  })

  it('accepts the size scale Verql call sites use', () => {
    render(
      <>
        <Spinner size="xs" />
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
        <Spinner size="xl" colorScheme="currentColor" />
      </>,
    )
    expect(screen.getAllByRole('status')).toHaveLength(5)
  })
})
