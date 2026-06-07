import type { Meta, StoryObj } from '@storybook/react-vite'
import { ColumnRow } from './ColumnRow'
import type { SchemaColumn } from '@shared/types'

// ColumnRow is a single row inside an expanded table/view card: an icon + name +
// data type + an optional PK/FK badge. It's fully prop-driven (the toast store is
// only touched on a context-menu action), so each story is just a `column` arg.

const meta: Meta<typeof ColumnRow> = {
  title: 'Components/Explorer/ColumnRow',
  component: ColumnRow,
  args: { tableName: 'users' },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 280,
          padding: 4,
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 8,
        }}
      >
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

const col = (over: Partial<SchemaColumn>): SchemaColumn => ({
  name: 'id',
  dataType: 'bigint',
  nullable: false,
  defaultValue: null,
  isPrimaryKey: false,
  isForeignKey: false,
  ...over,
})

/** A primary-key column — warning-tinted key icon + PK badge. */
export const PrimaryKey: Story = {
  args: { column: col({ name: 'id', dataType: 'bigint', isPrimaryKey: true }) },
}

/** A foreign-key column — info-tinted link icon + FK badge. */
export const ForeignKey: Story = {
  args: {
    column: col({
      name: 'org_id',
      dataType: 'uuid',
      isForeignKey: true,
      references: { table: 'organizations', column: 'id' },
    }),
  },
}

/** A plain column — neutral hash icon, no badge. */
export const Plain: Story = {
  args: { column: col({ name: 'email', dataType: 'varchar(255)' }) },
}

/** Long name + long type both truncate within the row. */
export const Truncated: Story = {
  args: {
    column: col({
      name: 'extremely_long_descriptive_column_name_that_overflows',
      dataType: 'character varying(1024)',
      nullable: true,
    }),
  },
}
