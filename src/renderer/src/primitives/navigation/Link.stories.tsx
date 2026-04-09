import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { Link } from './Link'

const meta = {
  title: 'Primitives/Navigation/Link',
  component: Link,
  tags: ['autodocs'],
  argTypes: {
    href: { control: 'text' },
    children: { control: 'text' },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    href: '#',
    children: 'View documentation',
  },
  play: async ({ args, canvas }) => {
    const link = canvas.getByRole('link', { name: 'View documentation' })
    link.addEventListener('click', (e) => e.preventDefault(), { once: true })
    await userEvent.click(link)
    await expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}

export const InContext: Story = {
  render: () => (
    <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
      Connect to your database by adding a{' '}
      <Link href="#">new connection</Link>
      {' '}or importing from a{' '}
      <Link href="#">connection string</Link>.
    </p>
  ),
}
