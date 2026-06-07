import type { Meta, StoryObj } from '@storybook/react-vite'
import { ResultsStatusBar } from './ResultsStatusBar'
import { Button } from '@/primitives'
import type { QueryResult } from '@shared/types'

// ResultsStatusBar is fully prop-driven: it summarises a QueryResult's row
// count / duration / column count (and affected rows when present) and renders
// CSV/JSON export buttons. Export wires to IPC, but the global electronAPI stub
// makes the buttons inert here, so each story just supplies a realistic
// QueryResult shape.

const selectResult: QueryResult = {
  rows: Array.from({ length: 100 }, (_, i) => ({ id: i + 1, email: `user${i}@acme.dev` })),
  fields: [
    { name: 'id', dataType: 'int4', nullable: false },
    { name: 'email', dataType: 'text', nullable: false },
    { name: 'created_at', dataType: 'timestamptz', nullable: true },
  ],
  rowCount: 100,
  duration: 14,
  affectedRows: 0,
}

const meta: Meta<typeof ResultsStatusBar> = {
  title: 'Components/Results/ResultsStatusBar',
  component: ResultsStatusBar,
  decorators: [
    (Story) => (
      <div style={{ width: 720, maxWidth: '100%', border: '1px solid var(--color-border-default)' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** A typical SELECT result: row/column counts and a fast duration. */
export const Select: Story = {
  args: { results: selectResult },
}

/** A write statement (UPDATE/INSERT) — affected-rows chip appears. */
export const WithAffectedRows: Story = {
  args: {
    results: {
      rows: [],
      fields: [],
      rowCount: 0,
      duration: 42,
      affectedRows: 37,
    },
  },
}

/** An empty result set (no rows matched). */
export const EmptyResult: Story = {
  args: {
    results: {
      rows: [],
      fields: [
        { name: 'id', dataType: 'int4', nullable: false },
        { name: 'name', dataType: 'text', nullable: true },
      ],
      rowCount: 0,
      duration: 3,
      affectedRows: 0,
    },
  },
}

/** A slow, large result — exercises the duration + row-count formatting. */
export const SlowLargeResult: Story = {
  args: {
    results: {
      rows: Array.from({ length: 5000 }, (_, i) => ({ id: i })),
      fields: Array.from({ length: 12 }, (_, i) => ({
        name: `col_${i}`,
        dataType: 'text',
        nullable: true,
      })),
      rowCount: 5000,
      duration: 2384,
      affectedRows: 0,
    },
  },
}

/** With a plugin-contributed inline action (e.g. an AI "Explain" button). */
export const WithPluginAction: Story = {
  args: {
    results: selectResult,
    actions: (
      <Button variant="ghost" size="xs" className="h-auto py-0">
        Explain
      </Button>
    ),
  },
}
