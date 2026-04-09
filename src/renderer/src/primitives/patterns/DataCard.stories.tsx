import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../data-display/Badge'
import { KeyValue } from '../data-display/KeyValue'
import { Table } from '../data-display/Table'

const meta: Meta = {
  title: 'Patterns/DataCard',
  tags: ['autodocs'],
}
export default meta

export const Default: StoryObj = {
  render: () => (
    <div className="w-[480px] rounded-lg border border-border-default bg-bg-secondary shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        <h3 className="text-sm font-semibold text-text-primary">users</h3>
        <div className="flex gap-1.5">
          <Badge variant="accent">PostgreSQL</Badge>
          <Badge variant="success">Connected</Badge>
        </div>
      </div>
      <div className="p-4 border-b border-border-default">
        <KeyValue
          items={[
            { label: 'Rows', value: '12,847' },
            { label: 'Size', value: '4.2 MB' },
            { label: 'Last modified', value: '2026-04-09' },
          ]}
        />
      </div>
      <div className="p-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Column</Table.Head>
              <Table.Head>Type</Table.Head>
              <Table.Head>Nullable</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {[
              { col: 'id', type: 'serial', nullable: 'NO' },
              { col: 'name', type: 'varchar(255)', nullable: 'NO' },
              { col: 'email', type: 'varchar(255)', nullable: 'NO' },
              { col: 'created_at', type: 'timestamp', nullable: 'YES' },
            ].map((row) => (
              <Table.Row key={row.col}>
                <Table.Cell className="font-mono text-xs">{row.col}</Table.Cell>
                <Table.Cell className="text-text-secondary text-xs">{row.type}</Table.Cell>
                <Table.Cell className="text-xs">{row.nullable}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  ),
}
