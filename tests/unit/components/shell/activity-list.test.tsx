import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ActivityList } from '../../../../src/renderer/src/components/shell/ActivityPanel'
import type { ActivityEntry, ActivityKind } from '../../../../shared/activity'

const now = Date.now()
const ENTRIES: ActivityEntry[] = [
  { id: '1', ts: now, kind: 'query', level: 'success', title: 'q-one', detail: 'SELECT 1', source: 'Prod' },
  { id: '2', ts: now - 1, kind: 'connection', level: 'success', title: 'connected-row' },
  { id: '3', ts: now - 2, kind: 'query', level: 'error', title: 'q-two' },
]

function setup(active: Set<ActivityKind> = new Set()) {
  const onToggleKind = vi.fn()
  const onClear = vi.fn()
  render(<ActivityList entries={ENTRIES} active={active} onToggleKind={onToggleKind} onClear={onClear} />)
  return { onToggleKind, onClear }
}

describe('ActivityList', () => {
  it('renders all entries when no kind filter is active', () => {
    setup()
    expect(screen.getByText('q-one')).toBeInTheDocument()
    expect(screen.getByText('connected-row')).toBeInTheDocument()
    expect(screen.getByText('q-two')).toBeInTheDocument()
  })

  it('shows only the selected kind when a filter is active', () => {
    setup(new Set<ActivityKind>(['query']))
    expect(screen.getByText('q-one')).toBeInTheDocument()
    expect(screen.getByText('q-two')).toBeInTheDocument()
    expect(screen.queryByText('connected-row')).not.toBeInTheDocument()
  })

  it('toggles a kind filter when a chip is clicked', () => {
    const { onToggleKind } = setup()
    fireEvent.click(screen.getByTitle('Connections'))
    expect(onToggleKind).toHaveBeenCalledWith('connection')
  })

  it('invokes onClear from the clear button', () => {
    const { onClear } = setup()
    fireEvent.click(screen.getByTitle('Clear activity'))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('shows an empty state when there are no entries', () => {
    render(<ActivityList entries={[]} active={new Set()} onToggleKind={() => {}} onClear={() => {}} />)
    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument()
  })

  it('expands an entry detail on click', () => {
    setup()
    expect(screen.queryByText('SELECT 1')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('q-one'))
    expect(screen.getByText('SELECT 1')).toBeInTheDocument()
  })
})
