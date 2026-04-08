import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './Textarea'

const meta = {
  title: 'Forms/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    rows: { control: 'number' },
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    size: 'md',
    placeholder: 'Enter your message…',
    rows: 4,
    style: { width: 320 },
  },
}

export const ErrorState: Story = {
  args: {
    size: 'md',
    error: true,
    rows: 3,
    defaultValue: 'This content has an error',
    style: { width: 320 },
  },
}
