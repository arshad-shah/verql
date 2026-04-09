import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { Popover } from '../../../../src/renderer/src/primitives/surfaces/Popover'
import { Tooltip } from '../../../../src/renderer/src/primitives/surfaces/Tooltip'
import { DropdownMenu } from '../../../../src/renderer/src/primitives/surfaces/DropdownMenu'
import { ContextMenu } from '../../../../src/renderer/src/primitives/surfaces/ContextMenu'

describe('Popover', () => {
  it('renders trigger', () => {
    render(
      <Popover trigger={<button>Open</button>} content={<div>pop content</div>} />
    )
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('renders content element', () => {
    render(
      <Popover trigger={<button>Open</button>} content={<div>pop content</div>} />
    )
    expect(screen.getByText('pop content')).toBeInTheDocument()
  })
})

describe('Tooltip', () => {
  it('renders children', () => {
    render(
      <Tooltip content="tooltip text">
        <button>hover me</button>
      </Tooltip>
    )
    expect(screen.getByText('hover me')).toBeInTheDocument()
  })

  it('renders tooltip content element in DOM', async () => {
    vi.useFakeTimers()
    render(
      <Tooltip content="my tooltip" delay={0}>
        <span>target</span>
      </Tooltip>
    )

    await act(async () => {
      fireEvent.mouseEnter(screen.getByText('target'))
    })
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    vi.useRealTimers()
  })
})

describe('DropdownMenu', () => {
  it('renders trigger', () => {
    render(
      <DropdownMenu
        trigger={<button>Menu</button>}
        items={[{ label: 'Item 1', onSelect: () => {} }]}
      />
    )
    expect(screen.getByText('Menu')).toBeInTheDocument()
  })

  it('renders menu items in DOM', () => {
    render(
      <DropdownMenu
        trigger={<button>Menu</button>}
        items={[
          { label: 'Item 1', onSelect: () => {} },
          { label: 'Item 2', onSelect: () => {} },
        ]}
      />
    )
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })
})

describe('ContextMenu', () => {
  it('renders children', () => {
    render(
      <ContextMenu items={[{ label: 'Copy', onSelect: () => {} }]}>
        <div>right click me</div>
      </ContextMenu>
    )
    expect(screen.getByText('right click me')).toBeInTheDocument()
  })
})
