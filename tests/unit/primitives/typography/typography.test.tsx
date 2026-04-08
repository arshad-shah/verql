import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React, { createRef } from 'react'
import { Text } from '../../../../src/renderer/src/primitives/typography/Text'
import { Heading } from '../../../../src/renderer/src/primitives/typography/Heading'
import { Code } from '../../../../src/renderer/src/primitives/typography/Code'
import { Kbd } from '../../../../src/renderer/src/primitives/typography/Kbd'

describe('Text', () => {
  it('renders as span by default', () => {
    const { container } = render(<Text>hello</Text>)
    expect(container.firstChild?.nodeName).toBe('SPAN')
  })

  it('applies size=xs class', () => {
    const { container } = render(<Text size="xs">hello</Text>)
    expect(container.firstChild).toHaveClass('text-xs')
  })

  it('applies size=base class', () => {
    const { container } = render(<Text size="base">hello</Text>)
    expect(container.firstChild).toHaveClass('text-base')
  })

  it('applies size=lg class', () => {
    const { container } = render(<Text size="lg">hello</Text>)
    expect(container.firstChild).toHaveClass('text-lg')
  })

  it('applies size=xl class', () => {
    const { container } = render(<Text size="xl">hello</Text>)
    expect(container.firstChild).toHaveClass('text-xl')
  })

  it('applies color=primary class', () => {
    const { container } = render(<Text color="primary">hello</Text>)
    expect(container.firstChild).toHaveClass('text-text-primary')
  })

  it('applies color=secondary class', () => {
    const { container } = render(<Text color="secondary">hello</Text>)
    expect(container.firstChild).toHaveClass('text-text-secondary')
  })

  it('applies color=muted class', () => {
    const { container } = render(<Text color="muted">hello</Text>)
    expect(container.firstChild).toHaveClass('text-text-muted')
  })

  it('applies color=accent class', () => {
    const { container } = render(<Text color="accent">hello</Text>)
    expect(container.firstChild).toHaveClass('text-accent')
  })

  it('applies weight=medium class', () => {
    const { container } = render(<Text weight="medium">hello</Text>)
    expect(container.firstChild).toHaveClass('font-medium')
  })

  it('applies weight=semibold class', () => {
    const { container } = render(<Text weight="semibold">hello</Text>)
    expect(container.firstChild).toHaveClass('font-semibold')
  })

  it('applies weight=bold class', () => {
    const { container } = render(<Text weight="bold">hello</Text>)
    expect(container.firstChild).toHaveClass('font-bold')
  })

  it('applies truncate class when truncate=true', () => {
    const { container } = render(<Text truncate>hello</Text>)
    expect(container.firstChild).toHaveClass('truncate')
  })

  it('renders as p when as="p"', () => {
    const { container } = render(<Text as="p">hello</Text>)
    expect(container.firstChild?.nodeName).toBe('P')
  })

  it('merges custom className', () => {
    const { container } = render(<Text className="custom-class">hello</Text>)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Text ref={ref}>hello</Text>)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.nodeName).toBe('SPAN')
  })
})

describe('Heading', () => {
  it('renders h2 by default', () => {
    const { container } = render(<Heading>Title</Heading>)
    expect(container.firstChild?.nodeName).toBe('H2')
  })

  it('renders h1 when level=1', () => {
    const { container } = render(<Heading level={1}>Title</Heading>)
    expect(container.firstChild?.nodeName).toBe('H1')
  })

  it('renders h3 when level=3', () => {
    const { container } = render(<Heading level={3}>Title</Heading>)
    expect(container.firstChild?.nodeName).toBe('H3')
  })

  it('renders h4 when level=4', () => {
    const { container } = render(<Heading level={4}>Title</Heading>)
    expect(container.firstChild?.nodeName).toBe('H4')
  })

  it('renders h5 when level=5', () => {
    const { container } = render(<Heading level={5}>Title</Heading>)
    expect(container.firstChild?.nodeName).toBe('H5')
  })

  it('renders h6 when level=6', () => {
    const { container } = render(<Heading level={6}>Title</Heading>)
    expect(container.firstChild?.nodeName).toBe('H6')
  })

  it('applies text-3xl and font-bold for level=1', () => {
    const { container } = render(<Heading level={1}>Title</Heading>)
    expect(container.firstChild).toHaveClass('text-3xl')
    expect(container.firstChild).toHaveClass('font-bold')
  })

  it('applies text-2xl and font-semibold for level=2', () => {
    const { container } = render(<Heading>Title</Heading>)
    expect(container.firstChild).toHaveClass('text-2xl')
    expect(container.firstChild).toHaveClass('font-semibold')
  })

  it('applies text-xl and font-semibold for level=3', () => {
    const { container } = render(<Heading level={3}>Title</Heading>)
    expect(container.firstChild).toHaveClass('text-xl')
    expect(container.firstChild).toHaveClass('font-semibold')
  })

  it('applies text-lg and font-medium for level=4', () => {
    const { container } = render(<Heading level={4}>Title</Heading>)
    expect(container.firstChild).toHaveClass('text-lg')
    expect(container.firstChild).toHaveClass('font-medium')
  })

  it('applies text-base and font-medium for level=5', () => {
    const { container } = render(<Heading level={5}>Title</Heading>)
    expect(container.firstChild).toHaveClass('text-base')
    expect(container.firstChild).toHaveClass('font-medium')
  })

  it('applies text-sm and font-medium for level=6', () => {
    const { container } = render(<Heading level={6}>Title</Heading>)
    expect(container.firstChild).toHaveClass('text-sm')
    expect(container.firstChild).toHaveClass('font-medium')
  })

  it('always has text-text-primary class', () => {
    const { container } = render(<Heading>Title</Heading>)
    expect(container.firstChild).toHaveClass('text-text-primary')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLHeadingElement>()
    render(<Heading ref={ref}>Title</Heading>)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.nodeName).toBe('H2')
  })
})

describe('Code', () => {
  it('renders inline code element by default', () => {
    const { container } = render(<Code>const x = 1</Code>)
    expect(container.firstChild?.nodeName).toBe('CODE')
  })

  it('applies inline styles for default (non-block) code', () => {
    const { container } = render(<Code>const x = 1</Code>)
    expect(container.firstChild).toHaveClass('font-mono')
    expect(container.firstChild).toHaveClass('text-xs')
    expect(container.firstChild).toHaveClass('bg-bg-tertiary')
    expect(container.firstChild).toHaveClass('rounded')
  })

  it('renders pre wrapping code when block=true', () => {
    const { container } = render(<Code block>const x = 1</Code>)
    expect(container.firstChild?.nodeName).toBe('PRE')
    expect(container.firstChild?.firstChild?.nodeName).toBe('CODE')
  })

  it('applies block styles when block=true', () => {
    const { container } = render(<Code block>const x = 1</Code>)
    expect(container.firstChild).toHaveClass('bg-bg-tertiary')
    expect(container.firstChild).toHaveClass('rounded-md')
    expect(container.firstChild).toHaveClass('overflow-x-auto')
  })

  it('forwards ref for inline code', () => {
    const ref = createRef<HTMLElement>()
    render(<Code ref={ref}>const x = 1</Code>)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.nodeName).toBe('CODE')
  })
})

describe('Kbd', () => {
  it('renders kbd element', () => {
    const { container } = render(<Kbd>Ctrl+K</Kbd>)
    expect(container.firstChild?.nodeName).toBe('KBD')
  })

  it('has font-mono class', () => {
    const { container } = render(<Kbd>Ctrl+K</Kbd>)
    expect(container.firstChild).toHaveClass('font-mono')
  })

  it('has text-xs class', () => {
    const { container } = render(<Kbd>Ctrl+K</Kbd>)
    expect(container.firstChild).toHaveClass('text-xs')
  })

  it('has border class', () => {
    const { container } = render(<Kbd>Ctrl+K</Kbd>)
    expect(container.firstChild).toHaveClass('border')
  })

  it('has bg-bg-tertiary class', () => {
    const { container } = render(<Kbd>Ctrl+K</Kbd>)
    expect(container.firstChild).toHaveClass('bg-bg-tertiary')
  })

  it('has text-text-secondary class', () => {
    const { container } = render(<Kbd>Ctrl+K</Kbd>)
    expect(container.firstChild).toHaveClass('text-text-secondary')
  })

  it('renders children correctly', () => {
    render(<Kbd>Enter</Kbd>)
    expect(screen.getByText('Enter')).toBeInTheDocument()
  })

  it('merges custom className', () => {
    const { container } = render(<Kbd className="extra-class">Ctrl+K</Kbd>)
    expect(container.firstChild).toHaveClass('extra-class')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLElement>()
    render(<Kbd ref={ref}>Ctrl+K</Kbd>)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.nodeName).toBe('KBD')
  })
})
