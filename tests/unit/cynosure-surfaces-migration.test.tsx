// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@arshad-shah/cynosure-react/dialog'
import { Tooltip, TooltipProvider } from '@arshad-shah/cynosure-react/tooltip'
import { Card } from '@arshad-shah/cynosure-react/card'
import { Popover, PopoverContent, PopoverTrigger } from '@arshad-shah/cynosure-react/popover'

/**
 * Stage 7 of the Cynosure migration replaced the surface/overlay primitives
 * (docs/cynosure-migration.md). Pins the composition shapes call sites now
 * use: Dialog open/onOpenChange (Verql Modal's onClose maps to the
 * `open === false` transition), Tooltip content/delayDuration, Popover
 * trigger/content parts, and Card's padding scale.
 */

describe('Cynosure Dialog (migration contract)', () => {
  it('renders content when open and reports close through onOpenChange', () => {
    const onOpenChange = vi.fn()
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save query</DialogTitle>
          </DialogHeader>
          <p>body</p>
          <DialogFooter>
            <button>Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Save query')).toBeInTheDocument()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders nothing when closed', () => {
    render(
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>
          <p>hidden</p>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.queryByText('hidden')).not.toBeInTheDocument()
  })
})

describe('Cynosure Tooltip (migration contract)', () => {
  it('accepts content/side/delayDuration and keeps the child as trigger', () => {
    render(
      <TooltipProvider>
        <Tooltip content="Close tab" side="bottom" delayDuration={600}>
          <button>×</button>
        </Tooltip>
      </TooltipProvider>,
    )
    expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument()
  })
})

describe('Cynosure Popover (migration contract)', () => {
  it('opens content from the trigger', () => {
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button>open</button>
        </PopoverTrigger>
        <PopoverContent>popover body</PopoverContent>
      </Popover>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'open' }))
    expect(screen.getByText('popover body')).toBeInTheDocument()
  })
})

describe('Cynosure Card (migration contract)', () => {
  it('accepts the padding scale Verql call sites map onto', () => {
    render(
      <>
        <Card padding="sm">a</Card>
        <Card padding="md">b</Card>
      </>,
    )
    expect(screen.getByText('a')).toBeInTheDocument()
  })
})
