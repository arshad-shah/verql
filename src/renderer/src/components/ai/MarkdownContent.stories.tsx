import type { Meta, StoryObj } from '@storybook/react-vite'
import { MarkdownContent } from './MarkdownContent'

const meta: Meta<typeof MarkdownContent> = {
  title: 'Components/AI/MarkdownContent',
  component: MarkdownContent,
  decorators: [
    (Story) => (
      <div style={{ width: 420, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

export const Paragraphs: Story = {
  args: {
    content:
      'The `users` table has **1,284 rows**. The most recent signup was today.\n\nIt is indexed on `email` and `created_at`.',
  },
}

export const Lists: Story = {
  args: {
    content:
      'Here are the largest tables:\n\n1. `events` — 4.2M rows\n2. `orders` — 880k rows\n3. `users` — 1.2k rows\n\nThings to check:\n\n- Missing index on `events.user_id`\n- Unused column `orders.legacy_ref`',
  },
}

export const CodeBlockContent: Story = {
  args: {
    content:
      'To find the top customers, run:\n\n```sql\nSELECT u.name, COUNT(o.id) AS orders\nFROM users u\nJOIN orders o ON o.user_id = u.id\nGROUP BY u.name\nORDER BY orders DESC\nLIMIT 5;\n```\n\nThis joins `users` and `orders`.',
  },
}

export const Table: Story = {
  args: {
    content:
      'The `users` columns:\n\n| Column | Type | Nullable |\n|--------|------|----------|\n| id | serial | NO |\n| email | varchar(255) | NO |\n| name | varchar(100) | YES |\n| created_at | timestamp | NO |',
  },
}
