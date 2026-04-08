import type { Meta, StoryObj } from '@storybook/react'
import { Code } from './Code'

const meta = {
  title: 'Typography/Code',
  component: Code,
  tags: ['autodocs'],
  argTypes: {
    block: { control: 'boolean' },
  },
} satisfies Meta<typeof Code>

export default meta
type Story = StoryObj<typeof meta>

export const Inline: Story = {
  args: {
    block: false,
    children: 'console.log("hello")',
  },
}

export const Block: Story = {
  args: {
    block: true,
    children: `function greet(name: string) {\n  return \`Hello, \${name}!\`\n}`,
  },
}

export const InlineInContext: Story = {
  render: () => (
    <p style={{ color: 'var(--color-text-primary)', fontSize: 14, lineHeight: 1.6 }}>
      Call <Code>document.getElementById()</Code> to select an element, or use <Code>querySelector()</Code> for CSS selectors.
    </p>
  ),
}
