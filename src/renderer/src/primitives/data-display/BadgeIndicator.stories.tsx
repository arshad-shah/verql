import type { Meta, StoryObj } from '@storybook/react-vite'
import { BadgeIndicator } from './BadgeIndicator'

const IconButton = ({ children }: { children: React.ReactNode }) => (
  <button
    className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-bg-elevated text-text-primary hover:bg-bg-hover"
    aria-label="Notifications"
  >
    {children}
  </button>
)

const BellIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
)

const meta = {
  title: 'Primitives/Data Display/BadgeIndicator',
  component: BadgeIndicator,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['dot', 'number'],
    },
    count: { control: 'number' },
    max: { control: 'number' },
    hidden: { control: 'boolean' },
  },
} satisfies Meta<typeof BadgeIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Dot: Story = {
  args: {
    variant: 'dot',
    children: null as unknown as React.ReactNode,
  },
  render: (args) => (
    <BadgeIndicator {...args}>
      <IconButton>
        <BellIcon />
      </IconButton>
    </BadgeIndicator>
  ),
}

export const Number: Story = {
  args: {
    variant: 'number',
    count: 5,
  },
  render: (args) => (
    <BadgeIndicator {...args}>
      <IconButton>
        <BellIcon />
      </IconButton>
    </BadgeIndicator>
  ),
}

export const OverMax: Story = {
  name: 'Number exceeding max',
  args: {
    variant: 'number',
    count: 150,
    max: 99,
  },
  render: (args) => (
    <BadgeIndicator {...args}>
      <IconButton>
        <BellIcon />
      </IconButton>
    </BadgeIndicator>
  ),
}

export const Hidden: Story = {
  args: {
    variant: 'dot',
    hidden: true,
  },
  render: (args) => (
    <BadgeIndicator {...args}>
      <IconButton>
        <BellIcon />
      </IconButton>
    </BadgeIndicator>
  ),
}

export const ZeroCount: Story = {
  name: 'Zero count hides indicator',
  args: {
    variant: 'number',
    count: 0,
  },
  render: (args) => (
    <BadgeIndicator {...args}>
      <IconButton>
        <BellIcon />
      </IconButton>
    </BadgeIndicator>
  ),
}

export const OnAvatar: Story = {
  name: 'On avatar',
  args: {
    variant: 'dot',
  },
  render: (args) => (
    <BadgeIndicator {...args}>
      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-accent/10 text-accent font-medium text-sm">
        AS
      </span>
    </BadgeIndicator>
  ),
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <BadgeIndicator variant="dot">
        <IconButton>
          <BellIcon />
        </IconButton>
      </BadgeIndicator>
      <BadgeIndicator variant="number" count={3}>
        <IconButton>
          <BellIcon />
        </IconButton>
      </BadgeIndicator>
      <BadgeIndicator variant="number" count={150} max={99}>
        <IconButton>
          <BellIcon />
        </IconButton>
      </BadgeIndicator>
    </div>
  ),
}
