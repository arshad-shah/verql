import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { FileContentInput } from './FileContentInput'

const meta: Meta<typeof FileContentInput> = {
  title: 'Primitives/Forms/FileContentInput',
  component: FileContentInput,
  decorators: [(Story) => <div className="w-80"><Story /></div>],
  argTypes: {
    disabled: { control: 'boolean' },
    defaultMode: { control: 'select', options: ['browse', 'paste'] },
  },
  args: {
    onChange: fn(),
  },
}
export default meta
type Story = StoryObj<typeof FileContentInput>

export const Default: Story = {
  args: { placeholder: 'Paste your private key here...' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Drop a file, or click to browse/i)).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Input mode' })).toBeInTheDocument()
  },
}

export const WithContent: Story = {
  args: {
    value: '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5v\nbmUAAAAEbm9uZQAAAAAAAAABAAAA\nMwAAAAtzc2gtZWQyNTUxOQAAACDr\n-----END OPENSSH PRIVATE KEY-----',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Pasted content')).toBeInTheDocument()
  },
}

export const PasteMode: Story = {
  args: {
    defaultMode: 'paste',
    placeholder: 'Paste your private key here...',
  },
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole('textbox')
    await expect(textarea).toBeInTheDocument()
    await userEvent.type(textarea, 'test content')
    await expect(args.onChange).toHaveBeenCalled()
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Drop a file, or click to browse/i)).toBeInTheDocument()
  },
}
