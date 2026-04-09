import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConnectionTestButton } from './ConnectionTestButton'

const meta: Meta<typeof ConnectionTestButton> = {
  title: 'Components/Connections/ConnectionTestButton',
  component: ConnectionTestButton,
  tags: ['autodocs'],
  args: {
    profile: {
      id: 'test-1',
      name: 'Test DB',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'testdb',
      username: 'postgres',
      password: '',
    },
  },
}
export default meta
type Story = StoryObj<typeof ConnectionTestButton>

export const Default: Story = {}
