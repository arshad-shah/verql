import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Code } from './Code'

const meta = {
  title: 'Primitives/Typography/Code',
  component: Code,
  argTypes: {
    block: { control: 'boolean' },
  },
} satisfies Meta<typeof Code>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    block: false,
    children: 'console.log("hello")',
  },
  play: async ({ canvas }) => {
    const code = canvas.getByText('console.log("hello")')
    await expect(code).toBeInTheDocument()
    await expect(code.tagName).toBe('CODE')
  },
}

export const Block: Story = {
  args: {
    block: true,
    children: `function greet(name: string) {\n  return \`Hello, \${name}!\`\n}`,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/function greet/)).toBeInTheDocument()
  },
}

export const InContext: Story = {
  render: () => (
    <p style={{ color: 'var(--color-text-primary)', fontSize: 14, lineHeight: 1.6 }}>
      Call <Code>document.getElementById()</Code> to select an element, or use <Code>querySelector()</Code> for CSS selectors.
    </p>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('document.getElementById()')).toBeInTheDocument()
    await expect(canvas.getByText('querySelector()')).toBeInTheDocument()
  },
}
