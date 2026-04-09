import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { FileContentInput } from './FileContentInput'

const meta: Meta<typeof FileContentInput> = {
  title: 'Primitives/Forms/FileContentInput',
  component: FileContentInput,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-80"><Story /></div>],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
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
  args: { size: 'md', placeholder: 'Paste your private key here...' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No file selected')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Browse' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Input mode' })).toBeInTheDocument()
  },
}

export const WithContent: Story = {
  args: {
    value: '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5v\nbmUAAAAEbm9uZQAAAAAAAAABAAAA\nMwAAAAtzc2gtZWQyNTUxOQAAACDr\n-----END OPENSSH PRIVATE KEY-----',
    size: 'md',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('loaded')).toBeInTheDocument()
    await expect(canvas.getByText('Pasted content')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  },
}

export const PasteMode: Story = {
  args: {
    defaultMode: 'paste',
    placeholder: 'Paste your private key here...',
    size: 'md',
  },
  play: async ({ args, canvas }) => {
    // The paste mode header shows "Paste content" label
    const textarea = canvas.getByRole('textbox')
    await expect(textarea).toBeInTheDocument()
    await userEvent.type(textarea, 'test content')
    await expect(args.onChange).toHaveBeenCalled()
  },
}

export const Disabled: Story = {
  args: { disabled: true, size: 'md' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No file selected')).toBeInTheDocument()
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-80">
      <FileContentInput size="xs" />
      <FileContentInput size="sm" />
      <FileContentInput size="md" />
      <FileContentInput size="lg" />
      <FileContentInput size="xl" />
    </div>
  ),
}
