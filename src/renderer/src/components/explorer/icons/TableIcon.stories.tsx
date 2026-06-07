import type { Meta, StoryObj } from '@storybook/react-vite'
import { TableIcon } from './TableIcon'

// Tiny leaf icon distinguishing a table from a view in the schema tree.
const meta: Meta<typeof TableIcon> = {
  title: 'Components/Explorer/Icons/TableIcon',
  component: TableIcon,
}
export default meta
type Story = StoryObj<typeof meta>

/** A base table — accent-coloured grid glyph. */
export const Table: Story = {
  args: { type: 'table' },
}

/** A view — info-coloured eye glyph. */
export const View: Story = {
  args: { type: 'view' },
}
