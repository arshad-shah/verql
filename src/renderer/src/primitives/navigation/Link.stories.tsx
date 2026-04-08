import type { Meta, StoryObj } from '@storybook/react'
import { Link } from './Link'

const meta = {
  title: 'Navigation/Link',
  component: Link,
  tags: ['autodocs'],
  argTypes: {
    href: { control: 'text' },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    href: '#',
    children: 'View documentation',
  },
}

export const InlineParagraph: Story = {
  render: () => (
    <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
      Connect to your database by adding a{' '}
      <Link href="#">new connection</Link>
      {' '}or importing from a{' '}
      <Link href="#">connection string</Link>.
    </p>
  ),
}
