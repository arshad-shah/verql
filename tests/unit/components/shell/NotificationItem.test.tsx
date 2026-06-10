import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { NotificationItem } from '../../../../src/renderer/src/components/shell/NotificationItem'
import type { Notification } from '../../../../src/renderer/src/stores/notifications'

const makeNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'n1',
  type: 'error',
  message: 'Query failed: relation "userss" does not exist',
  timestamp: Date.now() - 120_000,
  read: false,
  ...overrides,
})

describe('NotificationItem', () => {
  it('renders the notification message', () => {
    render(<NotificationItem notification={makeNotification()} onClick={() => {}} />)
    expect(screen.getByText(/Query failed/)).toBeInTheDocument()
  })

  it('renders source label and relative time', () => {
    render(
      <NotificationItem
        notification={makeNotification({
          source: { type: 'tab', id: 't1', label: 'User Query' },
        })}
        onClick={() => {}}
      />
    )
    expect(screen.getByText(/User Query/)).toBeInTheDocument()
  })

  it('drops the unread marker when read (Cynosure data-unread)', () => {
    const { container } = render(
      <NotificationItem notification={makeNotification({ read: true })} onClick={() => {}} />
    )
    expect(container.firstChild).not.toHaveAttribute('data-unread')
  })

  it('does not apply dimmed style when unread', () => {
    const { container } = render(
      <NotificationItem notification={makeNotification({ read: false })} onClick={() => {}} />
    )
    expect(container.firstChild).not.toHaveClass('opacity-60')
  })

  it('reports the read action when an unread item is clicked', () => {
    const handler = vi.fn()
    render(<NotificationItem notification={makeNotification({ read: false })} onClick={handler} />)
    fireEvent.click(screen.getByText(/Query failed/))
    expect(handler).toHaveBeenCalledWith('n1')
  })
})
