import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { FileContentInput } from './FileContentInput'

const meta: Meta<typeof FileContentInput> = {
  title: 'Primitives/Forms/FileContentInput',
  component: FileContentInput,
  tags: ['autodocs'],
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
}

export const WithContent: Story = {
  args: {
    value: '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5v\nbmUAAAAEbm9uZQAAAAAAAAABAAAA\nMwAAAAtzc2gtZWQyNTUxOQAAACDr\n-----END OPENSSH PRIVATE KEY-----',
    size: 'md',
  },
}

export const PasteMode: Story = {
  args: {
    defaultMode: 'paste',
    placeholder: 'Paste your private key here...',
    size: 'md',
  },
}

export const Disabled: Story = {
  args: { disabled: true, size: 'md' },
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
