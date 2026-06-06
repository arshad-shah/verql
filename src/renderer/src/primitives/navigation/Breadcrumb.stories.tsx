import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { Breadcrumb } from './Breadcrumb'

const meta = {
  title: 'Primitives/Navigation/Breadcrumb',
  component: Breadcrumb,
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

const onClickConnections = fn()
const onClickMyPostgres = fn()
const onClickPublic = fn()

export const Default: Story = {
  args: {
    items: [
      { label: 'Connections', onClick: onClickConnections },
      { label: 'my-postgres', onClick: onClickMyPostgres },
      { label: 'public', onClick: onClickPublic },
      { label: 'users' },
    ],
  },
  play: async ({ canvas }) => {
    const connectionsBtn = canvas.getByRole('button', { name: 'Connections' })
    await userEvent.click(connectionsBtn)
    await expect(onClickConnections).toHaveBeenCalledTimes(1)

    const postgresBtn = canvas.getByRole('button', { name: 'my-postgres' })
    await userEvent.click(postgresBtn)
    await expect(onClickMyPostgres).toHaveBeenCalledTimes(1)
  },
}

export const Short: Story = {
  args: {
    items: [
      { label: 'Connections', onClick: fn() },
      { label: 'my-db' },
    ],
  },
}
