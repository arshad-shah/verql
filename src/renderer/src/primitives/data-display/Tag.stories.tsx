import type { Meta, StoryObj } from '@storybook/react'
import { Tag } from './Tag'

const meta = {
  title: 'Primitives/Data Display/Tag',
  component: Tag,
  tags: ['autodocs'],
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'postgresql',
  },
}

export const WithDismiss: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {['react', 'typescript', 'vite', 'tailwind'].map((tag) => (
        <Tag key={tag} onDismiss={() => alert(`Remove ${tag}`)}>
          {tag}
        </Tag>
      ))}
    </div>
  ),
}

