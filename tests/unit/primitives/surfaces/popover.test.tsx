import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { Popover } from '../../../../src/renderer/src/primitives/surfaces/Popover'
import { DropdownMenu } from '../../../../src/renderer/src/primitives/surfaces/DropdownMenu'
import { ContextMenu } from '../../../../src/renderer/src/primitives/surfaces/ContextMenu'

describe('Popover', () => {
  it('renders trigger', () => {
    render(
      <Popover trigger={<button>Open</button>} content={<div>pop content</div>} />
    )
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('renders content element after the trigger is clicked', async () => {
    render(
      <Popover trigger={<button>Open</button>} content={<div>pop content</div>} />
    )
    expect(screen.queryByText('pop content')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('Open'))
    expect(screen.getByText('pop content')).toBeInTheDocument()
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

  it('renders menu items in DOM after opening', async () => {
    render(
      <DropdownMenu
        trigger={<button>Menu</button>}
        items={[
          { label: 'Item 1', onSelect: () => {} },
          { label: 'Item 2', onSelect: () => {} },
        ]}
      />
    )
    await userEvent.click(screen.getByText('Menu'))
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
