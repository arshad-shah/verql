import type { Meta, StoryObj } from '@storybook/react-vite'
import { Flex } from './Flex'

const DemoBox = ({ children }: { children: string }) => (
  <div style={{ padding: '8px 16px', background: 'var(--color-bg-tertiary)', borderRadius: 4, fontSize: 12, color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}>
    {children}
  </div>
)

const meta = {
  title: 'Primitives/Layout/Flex',
  component: Flex,
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: ['row', 'column', 'row-reverse', 'column-reverse'],
    },
    gap: {
      control: 'select',
      options: [undefined, 'xs', 'sm', 'md', 'lg', 'xl'],
    },
    align: {
      control: 'select',
      options: [undefined, 'start', 'center', 'end', 'stretch', 'baseline'],
    },
    justify: {
      control: 'select',
      options: [undefined, 'start', 'center', 'end', 'between', 'around', 'evenly'],
    },
    wrap: { control: 'boolean' },
  },
} satisfies Meta<typeof Flex>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    direction: 'row',
    gap: 'md',
    align: 'center',
    children: (
      <>
        <DemoBox>Item A</DemoBox>
        <DemoBox>Item B</DemoBox>
        <DemoBox>Item C</DemoBox>
      </>
    ),
  },
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['row', 'column', 'row-reverse', 'column-reverse'] as const).map((dir) => (
        <div key={dir}>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>direction="{dir}"</div>
          <Flex direction={dir} gap="sm">
            <DemoBox>A</DemoBox>
            <DemoBox>B</DemoBox>
            <DemoBox>C</DemoBox>
          </Flex>
        </div>
      ))}
    </div>
  ),
}
