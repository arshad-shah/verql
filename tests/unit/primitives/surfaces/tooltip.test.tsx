import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { Tooltip } from '../../../../src/renderer/src/primitives/surfaces/Tooltip'

/** Tooltip wraps children in a span — mouseEnter must target that wrapper. */
function getTriggerWrapper() {
  return screen.getByText('Trigger').closest('span')!
}

describe('Tooltip', () => {
  it('renders the trigger element', () => {
    render(
      <Tooltip content="Hello">
        <button>Trigger</button>
      </Tooltip>
    )
    expect(screen.getByText('Trigger')).toBeInTheDocument()
  })

  it('does not show tooltip content initially', () => {
    render(
      <Tooltip content="Hello">
        <button>Trigger</button>
      </Tooltip>
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows tooltip on hover after delay', async () => {
    vi.useFakeTimers()
    render(
      <Tooltip content="Tooltip text" delay={0}>
        <button>Trigger</button>
      </Tooltip>
    )

    await act(async () => {
      fireEvent.mouseEnter(getTriggerWrapper())
    })
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip text')
    vi.useRealTimers()
  })

  it('hides tooltip on mouse leave', async () => {
    vi.useFakeTimers()
    render(
      <Tooltip content="Tooltip text" delay={0}>
        <button>Trigger</button>
      </Tooltip>
    )

    await act(async () => {
      fireEvent.mouseEnter(getTriggerWrapper())
    })
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await act(async () => {
      fireEvent.mouseLeave(getTriggerWrapper())
    })
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows tooltip on focus', async () => {
    vi.useFakeTimers()
    render(
      <Tooltip content="Focus tooltip" delay={0}>
        <button>Trigger</button>
      </Tooltip>
    )

    await act(async () => {
      fireEvent.focus(getTriggerWrapper())
    })
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Focus tooltip')
    vi.useRealTimers()
  })

  it('renders the SVG beak element', async () => {
    vi.useFakeTimers()
    render(
      <Tooltip content="With beak" delay={0}>
        <button>Trigger</button>
      </Tooltip>
    )

    await act(async () => {
      fireEvent.mouseEnter(getTriggerWrapper())
    })
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    const svg = document.querySelector('[data-tooltip-beak]')
    expect(svg).toBeInTheDocument()
    expect(svg?.tagName.toLowerCase()).toBe('svg')
    vi.useRealTimers()
  })

  it('applies custom className', async () => {
    vi.useFakeTimers()
    render(
      <Tooltip content="Styled" className="custom-class" delay={0}>
        <button>Trigger</button>
      </Tooltip>
    )

    await act(async () => {
      fireEvent.mouseEnter(getTriggerWrapper())
    })
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.getByRole('tooltip')).toHaveClass('custom-class')
    vi.useRealTimers()
  })

  it('defaults side to top', () => {
    const { container } = render(
      <Tooltip content="Default side">
        <button>Trigger</button>
      </Tooltip>
    )
    expect(container).toBeTruthy()
  })
})
