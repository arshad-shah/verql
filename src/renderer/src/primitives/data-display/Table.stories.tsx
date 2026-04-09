import type { Meta, StoryObj } from '@storybook/react'
import { Table } from './Table'

const meta = {
  title: 'Primitives/Data Display/Table',
  component: Table,
  tags: ['autodocs'],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

const users = [
  { id: 1, name: 'Alice Brown', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Editor' },
  { id: 3, name: 'Charlie D', email: 'charlie@example.com', role: 'Viewer' },
  { id: 4, name: 'Diana E', email: 'diana@example.com', role: 'Editor' },
]

export const Default: Story = {
  render: () => (
    <div style={{ width: 480 }}>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>ID</Table.Head>
            <Table.Head>Name</Table.Head>
            <Table.Head>Email</Table.Head>
            <Table.Head>Role</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map((user) => (
            <Table.Row key={user.id}>
              <Table.Cell>{user.id}</Table.Cell>
              <Table.Cell>{user.name}</Table.Cell>
              <Table.Cell>{user.email}</Table.Cell>
              <Table.Cell>{user.role}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  ),
}
