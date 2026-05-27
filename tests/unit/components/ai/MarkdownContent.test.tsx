import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { MarkdownContent } from '../../../../src/renderer/src/components/ai/MarkdownContent'
import { appActions } from '../../../../src/renderer/src/lib/app-actions/registry'

describe('MarkdownContent verql:// deep links', () => {
  beforeEach(() => {
    // Ensure the action exists so the chip renders enabled (as a button).
    appActions.register({
      id: 'new-connection', title: 'Add a Connection', description: 'Open the connection form',
      kind: 'navigation', run: () => {}
    })
  })

  it('renders a verql://action link as a clickable action chip (button), not an anchor', () => {
    render(<MarkdownContent content={'[Add a connection](verql://action/new-connection)'} />)
    // The chip is a real button the user can click...
    const button = screen.getByRole('button', { name: /add a connection/i })
    expect(button).toBeInTheDocument()
    // ...and it is NOT rendered as a sanitized/empty anchor.
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('still renders ordinary links as anchors', () => {
    render(<MarkdownContent content={'[docs](https://example.com)'} />)
    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute('href', 'https://example.com')
  })
})
