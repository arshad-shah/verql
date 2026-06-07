import type { Meta, StoryObj } from '@storybook/react-vite'
import type { SchemaColumn } from '@shared/types'
import { ColumnIcon } from './ColumnIcon'

// Leaf icon for a column row: key for a primary key, link for a foreign key,
// hash for a plain column. Driven entirely by the column's constraint flags.
const meta: Meta<typeof ColumnIcon> = {
  title: 'Components/Explorer/Icons/ColumnIcon',
  component: ColumnIcon,
}
export default meta
type Story = StoryObj<typeof meta>

function column(overrides: Partial<SchemaColumn>): SchemaColumn {
  return {
    name: 'id',
    dataType: 'integer',
    nullable: false,
    defaultValue: null,
    isPrimaryKey: false,
    isForeignKey: false,
    ...overrides,
  }
}

/** Primary-key column — warning-coloured key glyph. */
export const PrimaryKey: Story = {
  args: { column: column({ name: 'id', isPrimaryKey: true }) },
}

/** Foreign-key column — info-coloured link glyph. */
export const ForeignKey: Story = {
  args: {
    column: column({
      name: 'user_id',
      isForeignKey: true,
      references: { table: 'users', column: 'id' },
    }),
  },
}

/** Plain column — muted hash glyph. */
export const Plain: Story = {
  args: { column: column({ name: 'email', dataType: 'text' }) },
}
