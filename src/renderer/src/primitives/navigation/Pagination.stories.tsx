import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Pagination } from './Pagination'

const meta = {
  title: 'Primitives/Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  argTypes: {
    page: { control: 'number' },
    totalPages: { control: 'number' },
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [page, setPage] = useState(1)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Pagination page={page} totalPages={10} onPageChange={setPage} />
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Showing page {page} of 10
        </div>
      </div>
    )
  },
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>First page</div>
        <Pagination page={1} totalPages={5} onPageChange={() => {}} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Last page</div>
        <Pagination page={5} totalPages={5} onPageChange={() => {}} />
      </div>
    </div>
  ),
}
