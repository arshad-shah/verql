import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { useState } from 'react'
import { Pagination } from './Pagination'

const onPageChange = fn()

const meta = {
  title: 'Primitives/Navigation/Pagination',
  component: Pagination,
  argTypes: {
    page: { control: 'number' },
    totalPages: { control: 'number' },
  },
  args: {
    onPageChange,
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
  play: async ({ canvas }) => {
    const nextBtn = canvas.getByRole('button', { name: 'Next page' })
    await userEvent.click(nextBtn)
    // State-driven render: page advances to 2, next button still enabled
    const prevBtn = canvas.getByRole('button', { name: 'Previous page' })
    await expect(prevBtn).not.toBeDisabled()
  },
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>First page</div>
        <Pagination page={1} totalPages={5} onPageChange={fn()} aria-label="First page pagination" />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Last page</div>
        <Pagination page={5} totalPages={5} onPageChange={fn()} aria-label="Last page pagination" />
      </div>
    </div>
  ),
}
