import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Pagination } from './Pagination'

const meta = {
  title: 'Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  argTypes: {
    page: { control: 'number' },
    totalPages: { control: 'number' },
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
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

export const FirstPage: Story = {
  args: {
    page: 1,
    totalPages: 5,
    onPageChange: () => {},
  },
}

export const LastPage: Story = {
  args: {
    page: 5,
    totalPages: 5,
    onPageChange: () => {},
  },
}
