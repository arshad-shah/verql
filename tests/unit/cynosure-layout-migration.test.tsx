// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Stack } from '@arshad-shah/cynosure-react/stack'
import { Box } from '@arshad-shah/cynosure-react/box'
import { Grid } from '@arshad-shah/cynosure-react/grid'
import { Divider } from '@arshad-shah/cynosure-react/divider'
import { ScrollArea } from '@arshad-shah/cynosure-react/scroll-area'

/**
 * Stage 6 of the Cynosure migration replaced the layout primitives
 * (docs/cynosure-migration.md). Pins what the sweep relies on: the prop
 * unions Verql call sites kept (direction/align/justify), the remapped
 * space tokens (xs→1, sm→2, md→3, lg→4, xl→6), polymorphic `as`, and that
 * native attributes/events still pass through (the tab strip hangs drag
 * handlers off Flex).
 */

describe('Cynosure layout primitives (migration contract)', () => {
  it('Flex accepts the migrated prop unions and forwards native props', () => {
    const { container } = render(
      <Flex
        direction="row"
        align="center"
        justify="between"
        gap="2"
        wrap="wrap"
        data-tab-id="t1"
        draggable
        onClick={() => {}}
      >
        <span>child</span>
      </Flex>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.getAttribute('data-tab-id')).toBe('t1')
    expect(el.getAttribute('draggable')).toBe('true')
  })

  it('Stack/Grid accept the remapped gap tokens', () => {
    render(
      <>
        <Stack gap="1">a</Stack>
        <Stack gap="3">b</Stack>
        <Grid columns={2} gap="4">c</Grid>
        <Flex gap="0">d</Flex>
        <Flex gap="6">e</Flex>
      </>,
    )
    expect(screen.getByText('c')).toBeInTheDocument()
  })

  it('Box stays polymorphic (theme tiles render as buttons)', () => {
    render(
      <Box as="button" onClick={() => {}} padding="2">
        pick me
      </Box>,
    )
    expect(screen.getByRole('button', { name: 'pick me' })).toBeInTheDocument()
  })

  it('ScrollArea takes scrollbars (replaces Verql direction)', () => {
    const { container } = render(
      <ScrollArea scrollbars="vertical" className="flex-1">
        <div>content</div>
      </ScrollArea>,
    )
    expect(container.textContent).toContain('content')
  })

  it('Divider renders a separator in both orientations', () => {
    const { container } = render(
      <>
        <Divider />
        <Divider orientation="vertical" />
      </>,
    )
    expect(container.querySelectorAll('hr, [role="separator"]').length).toBeGreaterThanOrEqual(2)
  })
})
