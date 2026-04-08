import type { Meta, StoryObj } from '@storybook/react'
import { Breadcrumb } from './Breadcrumb'

const meta = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    items: [
      { label: 'Connections', onClick: () => {} },
      { label: 'my-postgres', onClick: () => {} },
      { label: 'public', onClick: () => {} },
      { label: 'users' },
    ],
  },
}

export const Short: Story = {
  args: {
    items: [
      { label: 'Connections', onClick: () => {} },
      { label: 'my-db' },
    ],
  },
}
