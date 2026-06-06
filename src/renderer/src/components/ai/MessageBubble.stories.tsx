import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageBubble } from './MessageBubble'
import type { AIChatMessage } from '@shared/ai-types'

const makeMessage = (overrides: Partial<AIChatMessage>): AIChatMessage => ({
  id: '1',
  role: 'user',
  content: 'Hello',
  timestamp: Date.now(),
  ...overrides,
})

const meta: Meta<typeof MessageBubble> = {
  title: 'Components/AI/MessageBubble',
  component: MessageBubble,
  decorators: [
    (Story) => (
      <div style={{ width: 360, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof MessageBubble>

export const UserMessage: Story = {
  args: {
    message: makeMessage({ role: 'user', content: 'Show me all tables in the public schema' }),
  },
}

export const AssistantMessage: Story = {
  args: {
    message: makeMessage({
      role: 'assistant',
      content: 'Here are the tables in the public schema:\n\n- `users` (12 columns)\n- `orders` (8 columns)\n- `products` (6 columns)',
    }),
  },
}

export const AssistantShortReply: Story = {
  args: {
    message: makeMessage({ role: 'assistant', content: '1,284 users signed up today.' }),
  },
}

export const AssistantError: Story = {
  args: {
    message: makeMessage({
      role: 'assistant',
      isError: true,
      content: 'Failed to connect to the database. Check your connection settings.',
    }),
  },
}

export const LongContent: Story = {
  args: {
    message: makeMessage({
      role: 'assistant',
      content: `The \`users\` table has the following structure:\n\n| Column | Type | Nullable | Default |\n|--------|------|----------|---------|\n| id | serial | NO | nextval('users_id_seq') |\n| email | varchar(255) | NO | |\n| name | varchar(100) | YES | |\n| created_at | timestamp | NO | now() |\n| updated_at | timestamp | YES | |\n| status | varchar(20) | NO | 'active' |\n\nThe table has a primary key on \`id\` and a unique constraint on \`email\`. There are 3 indexes defined.`,
    }),
  },
}

export const MarkdownContent: Story = {
  args: {
    message: makeMessage({
      role: 'assistant',
      content: `To get the top 10 customers by order count:\n\n\`\`\`sql\nSELECT u.name, COUNT(o.id) as order_count\nFROM users u\nJOIN orders o ON o.user_id = u.id\nGROUP BY u.name\nORDER BY order_count DESC\nLIMIT 10;\n\`\`\`\n\nThis joins the \`users\` and \`orders\` tables and groups by user name.`,
    }),
  },
}
