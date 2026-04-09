import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Accordion } from '../../../../src/renderer/src/primitives/surfaces/Accordion'

describe('Accordion', () => {
  it('renders trigger text', () => {
    render(
      <Accordion>
        <Accordion.Item>
          <Accordion.Trigger>Section Title</Accordion.Trigger>
          <Accordion.Content>Content here</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.getByText('Section Title')).toBeInTheDocument()
  })

  it('is open by default when defaultOpen is true', () => {
    render(
      <Accordion>
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>Title</Accordion.Trigger>
          <Accordion.Content>Visible content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.getByText('Visible content')).toBeInTheDocument()
  })

  it('is closed by default when defaultOpen is not set', () => {
    render(
      <Accordion>
        <Accordion.Item>
          <Accordion.Trigger>Title</Accordion.Trigger>
          <Accordion.Content>Hidden content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
  })

  it('toggles content on trigger click', () => {
    render(
      <Accordion>
        <Accordion.Item>
          <Accordion.Trigger>Toggle Me</Accordion.Trigger>
          <Accordion.Content>Toggled content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.queryByText('Toggled content')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Toggle Me'))
    expect(screen.getByText('Toggled content')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Toggle Me'))
    expect(screen.queryByText('Toggled content')).not.toBeInTheDocument()
  })

  it('supports controlled mode with open and onOpenChange', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Accordion>
        <Accordion.Item open={false} onOpenChange={onOpenChange}>
          <Accordion.Trigger>Controlled</Accordion.Trigger>
          <Accordion.Content>Controlled content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.queryByText('Controlled content')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Controlled'))
    expect(onOpenChange).toHaveBeenCalledWith(true)

    rerender(
      <Accordion>
        <Accordion.Item open={true} onOpenChange={onOpenChange}>
          <Accordion.Trigger>Controlled</Accordion.Trigger>
          <Accordion.Content>Controlled content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.getByText('Controlled content')).toBeInTheDocument()
  })

  it('renders actions without toggling on click', () => {
    const actionFn = vi.fn()
    render(
      <Accordion>
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>
            Title
            <Accordion.Actions>
              <button onClick={actionFn}>Add</button>
            </Accordion.Actions>
          </Accordion.Trigger>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    fireEvent.click(screen.getByText('Add'))
    expect(actionFn).toHaveBeenCalledTimes(1)
    // Content should still be visible (action click didn't toggle)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders a chevron icon in the trigger', () => {
    const { container } = render(
      <Accordion>
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>Title</Accordion.Trigger>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders multiple items', () => {
    render(
      <Accordion>
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>First</Accordion.Trigger>
          <Accordion.Content>First content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Trigger>Second</Accordion.Trigger>
          <Accordion.Content>Second content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.getByText('First content')).toBeInTheDocument()
    expect(screen.queryByText('Second content')).not.toBeInTheDocument()
  })

  it('applies sm size variant', () => {
    const { container } = render(
      <Accordion size="sm">
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>Title</Accordion.Trigger>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    const trigger = container.querySelector('button')
    expect(trigger).toHaveClass('text-xs')
  })
})
