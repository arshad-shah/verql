import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { ApprovalCardContent } from './ApprovalCard'
import type { AIApprovalRequest } from '@shared/ai-types'

const makeApproval = (overrides?: Partial<AIApprovalRequest>): AIApprovalRequest => ({
  requestId: 'req-1',
  toolName: 'execute_query',
  toolDescription: 'Execute a SQL query against the database',
  parameters: { sql: 'DROP TABLE users;' },
  display: 'DROP TABLE users;',
  ...overrides,
})

const meta: Meta<typeof ApprovalCardContent> = {
  title: 'Components/AI/ApprovalCard',
  component: ApprovalCardContent,
  decorators: [
    (Story) => (
      <div style={{ width: 360, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof ApprovalCardContent>

export const Default: Story = {
  args: {
    approval: makeApproval(),
    onRespond: fn(),
  },
  play: async ({ args, canvas }) => {
    const approveBtn = canvas.getByRole('button', { name: /run/i })
    await userEvent.click(approveBtn)
    await expect(args.onRespond).toHaveBeenCalledWith('req-1', true)
  },
}

export const Reject: Story = {
  args: {
    approval: makeApproval(),
    onRespond: fn(),
  },
  play: async ({ args, canvas }) => {
    const rejectBtn = canvas.getByRole('button', { name: /decline/i })
    await userEvent.click(rejectBtn)
    await expect(args.onRespond).toHaveBeenCalledWith('req-1', false)
  },
}

export const DifferentTools: Story = {
  render: () => {
    const noop = () => {}
    return (
      <div className="flex flex-col gap-4">
        <ApprovalCardContent
          approval={makeApproval({
            toolName: 'execute_query',
            display: 'DELETE FROM orders WHERE status = \'cancelled\'',
          })}
          onRespond={noop}
        />
        <ApprovalCardContent
          approval={makeApproval({
            toolName: 'modify_schema',
            toolDescription: 'Modify database schema',
            display: 'ALTER TABLE users ADD COLUMN phone VARCHAR(20)',
          })}
          onRespond={noop}
        />
        <ApprovalCardContent
          approval={makeApproval({
            toolName: 'create_index',
            toolDescription: 'Create a database index',
            display: 'CREATE INDEX idx_orders_user_id ON orders(user_id)',
          })}
          onRespond={noop}
        />
      </div>
    )
  },
}
