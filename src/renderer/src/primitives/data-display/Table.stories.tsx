import type { Meta, StoryObj } from '@storybook/react-vite'
import { Table } from './Table'

const meta = {
  title: 'Primitives/Data Display/Table',
  component: Table,
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

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: 600 }}>
      {/* Empty table — header only, no body rows */}
      <div>
        <p style={{ fontSize: 12, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Empty (header only)</p>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>ID</Table.Head>
              <Table.Head>Name</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Role</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body />
        </Table>
      </div>

      {/* Single row */}
      <div>
        <p style={{ fontSize: 12, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Single row</p>
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
            <Table.Row>
              <Table.Cell>1</Table.Cell>
              <Table.Cell>Alice Brown</Table.Cell>
              <Table.Cell>alice@example.com</Table.Cell>
              <Table.Cell>Admin</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </div>

      {/* Many columns (6+) */}
      <div>
        <p style={{ fontSize: 12, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Many columns (6+)</p>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>ID</Table.Head>
              <Table.Head>Name</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Role</Table.Head>
              <Table.Head>Department</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Joined</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>1</Table.Cell>
              <Table.Cell>Alice Brown</Table.Cell>
              <Table.Cell>alice@example.com</Table.Cell>
              <Table.Cell>Admin</Table.Cell>
              <Table.Cell>Engineering</Table.Cell>
              <Table.Cell>Active</Table.Cell>
              <Table.Cell>2024-01-15</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>2</Table.Cell>
              <Table.Cell>Bob Smith</Table.Cell>
              <Table.Cell>bob@example.com</Table.Cell>
              <Table.Cell>Editor</Table.Cell>
              <Table.Cell>Marketing</Table.Cell>
              <Table.Cell>Inactive</Table.Cell>
              <Table.Cell>2023-08-22</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </div>
    </div>
  ),
}
