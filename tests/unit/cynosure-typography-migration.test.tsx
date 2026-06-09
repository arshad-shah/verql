// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Heading } from '@arshad-shah/cynosure-react/heading'
import { Code } from '@arshad-shah/cynosure-react/code'
import { Kbd } from '@arshad-shah/cynosure-react/kbd'
import { KbdGroup } from '@/primitives/typography/KbdGroup'

/**
 * Stage 4 of the Cynosure migration replaced the Verql typography primitives
 * (docs/cynosure-migration.md). Pins what the call-site mapping relies on:
 * the color token paths exist, sizes accept the migrated scale, Heading keeps
 * semantic levels, and KbdGroup keeps its Electron-accelerator behaviour on
 * top of Cynosure keycaps.
 */

describe('Cynosure Text (migration contract)', () => {
  it('accepts the mapped color token paths and size scale', () => {
    render(
      <>
        <Text size="sm">default-color</Text>
        <Text size="xs" color="fg.muted">secondary</Text>
        <Text size="md" color="fg.subtle">muted</Text>
        <Text size="lg" color="fg.disabled">disabled</Text>
        <Text size="xl" color="accent.solid">accent</Text>
        <Text size="sm" color="feedback.danger.foreground">error</Text>
        <Text size="sm" color="feedback.success.foreground" weight="semibold" truncate>ok</Text>
      </>,
    )
    expect(screen.getByText('secondary')).toBeInTheDocument()
    expect(screen.getByText('ok')).toBeInTheDocument()
  })

  it('renders the requested intrinsic element via as', () => {
    render(<Text as="p" size="sm">para</Text>)
    expect(screen.getByText('para').tagName).toBe('P')
  })
})

describe('Cynosure Heading/Code (migration contract)', () => {
  it('renders the semantic heading level', () => {
    render(<Heading level={4}>Section</Heading>)
    expect(screen.getByRole('heading', { level: 4, name: 'Section' })).toBeInTheDocument()
  })

  it('renders block code (Verql `block` → variant="block")', () => {
    render(<Code variant="block">SELECT 1</Code>)
    expect(screen.getByText('SELECT 1')).toBeInTheDocument()
  })
})

describe('KbdGroup (Verql behaviour on Cynosure keycaps)', () => {
  it('parses Electron accelerators into individual keycaps', () => {
    render(<KbdGroup accelerator="CmdOrCtrl+Shift+P" />)
    const group = screen.getByLabelText('CmdOrCtrl+Shift+P')
    expect(group.querySelectorAll('kbd')).toHaveLength(3)
  })

  it('renders plain character keys uppercased', () => {
    render(<KbdGroup keys={['mod', 'k']} />)
    expect(screen.getByText('K')).toBeInTheDocument()
  })

  it('supports the plus separator', () => {
    render(<KbdGroup keys={['ctrl', 'c']} separator="plus" />)
    expect(screen.getByText('+')).toBeInTheDocument()
  })

  it('individual keycaps are Cynosure <kbd> elements', () => {
    const { container } = render(<Kbd size="sm">Tab</Kbd>)
    expect(container.querySelector('kbd')).not.toBeNull()
  })
})
