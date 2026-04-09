import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { StatusBarMetric } from '../../../../src/renderer/src/components/shell/StatusBarMetric'

describe('StatusBarMetric', () => {
  it('renders label text', () => {
    render(<StatusBarMetric color="success" label="142ms" />)
    expect(screen.getByText('142ms')).toBeInTheDocument()
  })

  it('renders with an icon when provided', () => {
    render(<StatusBarMetric color="success" label="142ms" icon="⚡" />)
    expect(screen.getByText('⚡')).toBeInTheDocument()
  })

  it('applies success color classes', () => {
    const { container } = render(<StatusBarMetric color="success" label="ok" />)
    const chip = container.firstChild as HTMLElement
    expect(chip.className).toContain('text-success')
  })

  it('applies error color classes', () => {
    const { container } = render(<StatusBarMetric color="error" label="fail" />)
    const chip = container.firstChild as HTMLElement
    expect(chip.className).toContain('text-error')
  })

  it('applies warning color classes', () => {
    const { container } = render(<StatusBarMetric color="warning" label="slow" />)
    const chip = container.firstChild as HTMLElement
    expect(chip.className).toContain('text-warning')
  })

  it('applies info color classes', () => {
    const { container } = render(<StatusBarMetric color="info" label="248 rows" />)
    const chip = container.firstChild as HTMLElement
    expect(chip.className).toContain('text-info')
  })

  it('shows animated pulse dot when animated prop is true', () => {
    const { container } = render(<StatusBarMetric color="warning" label="Running..." animated />)
    const dot = container.querySelector('[data-animated-dot]')
    expect(dot).toBeInTheDocument()
  })
})
