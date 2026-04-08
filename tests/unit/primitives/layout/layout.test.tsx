import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React, { createRef } from 'react'
import { Flex } from '../../../../src/renderer/src/primitives/layout/Flex'
import { Stack } from '../../../../src/renderer/src/primitives/layout/Stack'
import { Grid } from '../../../../src/renderer/src/primitives/layout/Grid'
import { Container } from '../../../../src/renderer/src/primitives/layout/Container'
import { Divider } from '../../../../src/renderer/src/primitives/layout/Divider'
import { Spacer } from '../../../../src/renderer/src/primitives/layout/Spacer'
import { ScrollArea } from '../../../../src/renderer/src/primitives/layout/ScrollArea'
import { AspectRatio } from '../../../../src/renderer/src/primitives/layout/AspectRatio'

// ─── Flex ────────────────────────────────────────────────────────────────────

describe('Flex', () => {
  it('renders children', () => {
    render(<Flex>hello</Flex>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('always has flex class', () => {
    const { container } = render(<Flex>content</Flex>)
    expect(container.firstChild).toHaveClass('flex')
  })

  it('applies direction class', () => {
    const { container } = render(<Flex direction="column">content</Flex>)
    expect(container.firstChild).toHaveClass('flex-col')
  })

  it('applies row-reverse direction', () => {
    const { container } = render(<Flex direction="row-reverse">content</Flex>)
    expect(container.firstChild).toHaveClass('flex-row-reverse')
  })

  it('applies gap class', () => {
    const { container } = render(<Flex gap="md">content</Flex>)
    expect(container.firstChild).toHaveClass('gap-3')
  })

  it('applies align class', () => {
    const { container } = render(<Flex align="center">content</Flex>)
    expect(container.firstChild).toHaveClass('items-center')
  })

  it('applies justify class', () => {
    const { container } = render(<Flex justify="between">content</Flex>)
    expect(container.firstChild).toHaveClass('justify-between')
  })

  it('applies wrap class when wrap is true', () => {
    const { container } = render(<Flex wrap>content</Flex>)
    expect(container.firstChild).toHaveClass('flex-wrap')
  })

  it('merges custom className', () => {
    const { container } = render(<Flex className="bg-red-500">content</Flex>)
    expect(container.firstChild).toHaveClass('bg-red-500')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Flex ref={ref}>content</Flex>)
    expect(ref.current).not.toBeNull()
  })
})

// ─── Stack ───────────────────────────────────────────────────────────────────

describe('Stack', () => {
  it('renders children', () => {
    render(<Stack>hello</Stack>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('is flex-col by default', () => {
    const { container } = render(<Stack>content</Stack>)
    expect(container.firstChild).toHaveClass('flex')
    expect(container.firstChild).toHaveClass('flex-col')
  })

  it('is flex-row when direction is horizontal', () => {
    const { container } = render(<Stack direction="horizontal">content</Stack>)
    expect(container.firstChild).toHaveClass('flex-row')
  })

  it('applies gap class', () => {
    const { container } = render(<Stack gap="lg">content</Stack>)
    expect(container.firstChild).toHaveClass('gap-4')
  })

  it('applies align class', () => {
    const { container } = render(<Stack align="center">content</Stack>)
    expect(container.firstChild).toHaveClass('items-center')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Stack ref={ref}>content</Stack>)
    expect(ref.current).not.toBeNull()
  })
})

// ─── Grid ────────────────────────────────────────────────────────────────────

describe('Grid', () => {
  it('renders children', () => {
    render(<Grid>hello</Grid>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('has grid class', () => {
    const { container } = render(<Grid>content</Grid>)
    expect(container.firstChild).toHaveClass('grid')
  })

  it('applies columns class', () => {
    const { container } = render(<Grid columns={3}>content</Grid>)
    expect(container.firstChild).toHaveClass('grid-cols-3')
  })

  it('applies gap class', () => {
    const { container } = render(<Grid gap="sm">content</Grid>)
    expect(container.firstChild).toHaveClass('gap-2')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Grid ref={ref}>content</Grid>)
    expect(ref.current).not.toBeNull()
  })
})

// ─── Container ───────────────────────────────────────────────────────────────

describe('Container', () => {
  it('renders children', () => {
    render(<Container>hello</Container>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('always has mx-auto w-full px-4', () => {
    const { container } = render(<Container>content</Container>)
    expect(container.firstChild).toHaveClass('mx-auto')
    expect(container.firstChild).toHaveClass('w-full')
    expect(container.firstChild).toHaveClass('px-4')
  })

  it('applies sm size', () => {
    const { container } = render(<Container size="sm">content</Container>)
    expect(container.firstChild).toHaveClass('max-w-2xl')
  })

  it('applies md size', () => {
    const { container } = render(<Container size="md">content</Container>)
    expect(container.firstChild).toHaveClass('max-w-4xl')
  })

  it('applies lg size', () => {
    const { container } = render(<Container size="lg">content</Container>)
    expect(container.firstChild).toHaveClass('max-w-6xl')
  })

  it('applies xl size', () => {
    const { container } = render(<Container size="xl">content</Container>)
    expect(container.firstChild).toHaveClass('max-w-7xl')
  })

  it('applies full size', () => {
    const { container } = render(<Container size="full">content</Container>)
    expect(container.firstChild).toHaveClass('max-w-full')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Container ref={ref}>content</Container>)
    expect(ref.current).not.toBeNull()
  })
})

// ─── Divider ─────────────────────────────────────────────────────────────────

describe('Divider', () => {
  it('renders with role separator', () => {
    const { container } = render(<Divider />)
    expect(container.firstChild).toHaveAttribute('role', 'separator')
  })

  it('is horizontal by default', () => {
    const { container } = render(<Divider />)
    expect(container.firstChild).toHaveAttribute('aria-orientation', 'horizontal')
    expect(container.firstChild).toHaveClass('border-t')
    expect(container.firstChild).toHaveClass('w-full')
  })

  it('is vertical when orientation is vertical', () => {
    const { container } = render(<Divider orientation="vertical" />)
    expect(container.firstChild).toHaveAttribute('aria-orientation', 'vertical')
    expect(container.firstChild).toHaveClass('border-l')
    expect(container.firstChild).toHaveClass('h-full')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Divider ref={ref} />)
    expect(ref.current).not.toBeNull()
  })
})

// ─── Spacer ───────────────────────────────────────────────────────────────────

describe('Spacer', () => {
  it('renders', () => {
    const { container } = render(<Spacer />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('has flex-1 class', () => {
    const { container } = render(<Spacer />)
    expect(container.firstChild).toHaveClass('flex-1')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Spacer ref={ref} />)
    expect(ref.current).not.toBeNull()
  })
})

// ─── ScrollArea ───────────────────────────────────────────────────────────────

describe('ScrollArea', () => {
  it('renders children', () => {
    render(<ScrollArea>hello</ScrollArea>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('defaults to overflow-auto (both)', () => {
    const { container } = render(<ScrollArea>content</ScrollArea>)
    expect(container.firstChild).toHaveClass('overflow-auto')
  })

  it('applies vertical overflow', () => {
    const { container } = render(<ScrollArea direction="vertical">content</ScrollArea>)
    expect(container.firstChild).toHaveClass('overflow-y-auto')
  })

  it('applies horizontal overflow', () => {
    const { container } = render(<ScrollArea direction="horizontal">content</ScrollArea>)
    expect(container.firstChild).toHaveClass('overflow-x-auto')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ScrollArea ref={ref}>content</ScrollArea>)
    expect(ref.current).not.toBeNull()
  })
})

// ─── AspectRatio ──────────────────────────────────────────────────────────────

describe('AspectRatio', () => {
  it('renders children', () => {
    render(<AspectRatio>hello</AspectRatio>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('defaults to aspect-video', () => {
    const { container } = render(<AspectRatio>content</AspectRatio>)
    expect(container.firstChild).toHaveClass('aspect-video')
  })

  it('applies square ratio', () => {
    const { container } = render(<AspectRatio ratio="square">content</AspectRatio>)
    expect(container.firstChild).toHaveClass('aspect-square')
  })

  it('applies 4/3 ratio', () => {
    const { container } = render(<AspectRatio ratio="4/3">content</AspectRatio>)
    expect(container.firstChild).toHaveClass('aspect-[4/3]')
  })

  it('has overflow-hidden', () => {
    const { container } = render(<AspectRatio>content</AspectRatio>)
    expect(container.firstChild).toHaveClass('overflow-hidden')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<AspectRatio ref={ref}>content</AspectRatio>)
    expect(ref.current).not.toBeNull()
  })
})
