import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
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

const onDismissTag = fn()

export const WithDismiss: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {['react', 'typescript', 'vite', 'tailwind'].map((tag) => (
        <Tag key={tag} onDismiss={onDismissTag}>
          {tag}
        </Tag>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const user = userEvent.setup()
    const dismissButtons = canvas.getAllByRole('button', { name: 'Remove' })
    await user.click(dismissButtons[0])
    await expect(onDismissTag).toHaveBeenCalled()
  },
}

