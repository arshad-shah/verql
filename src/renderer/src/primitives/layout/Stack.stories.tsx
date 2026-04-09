import type { Meta, StoryObj } from '@storybook/react'
import { Stack } from './Stack'

const DemoBox = ({ children }: { children: string }) => (
  <div style={{ padding: '8px 16px', background: 'var(--color-bg-tertiary)', borderRadius: 4, fontSize: 12, color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}>
    {children}
  </div>
)

const meta = {
  title: 'Primitives/Layout/Stack',
  component: Stack,
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
    gap: {
      control: 'select',
      options: [undefined, 'xs', 'sm', 'md', 'lg', 'xl'],
    },
    align: {
      control: 'select',
      options: [undefined, 'start', 'center', 'end', 'stretch', 'baseline'],
    },
  },
} satisfies Meta<typeof Stack>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    direction: 'vertical',
    gap: 'md',
    children: (
      <>
        <DemoBox>First</DemoBox>
        <DemoBox>Second</DemoBox>
        <DemoBox>Third</DemoBox>
      </>
    ),
  },
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['vertical', 'horizontal'] as const).map((dir) => (
        <div key={dir}>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>direction="{dir}"</div>
          <Stack direction={dir} gap="sm">
            <DemoBox>First</DemoBox>
            <DemoBox>Second</DemoBox>
            <DemoBox>Third</DemoBox>
          </Stack>
        </div>
      ))}
    </div>
  ),
}
