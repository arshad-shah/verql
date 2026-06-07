import type { Meta, StoryObj } from '@storybook/react-vite'
import { CodeBlock } from './CodeBlock'

const meta: Meta<typeof CodeBlock> = {
  title: 'Components/AI/CodeBlock',
  component: CodeBlock,
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

export const Sql: Story = {
  args: {
    language: 'sql',
    code: `SELECT u.name, COUNT(o.id) AS order_count
FROM users u
JOIN orders o ON o.user_id = u.id
GROUP BY u.name
ORDER BY order_count DESC
LIMIT 10;`,
  },
}

export const Json: Story = {
  args: {
    language: 'json',
    code: `{
  "table": "users",
  "rowCount": 1284,
  "columns": ["id", "email", "name"]
}`,
  },
}

export const WithoutInsert: Story = {
  args: {
    showInsert: false,
    language: 'sql',
    code: 'SELECT * FROM products WHERE price > 100;',
  },
}

export const NoLanguage: Story = {
  args: {
    code: 'pnpm dev',
  },
}
