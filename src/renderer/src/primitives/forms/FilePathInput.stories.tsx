import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect } from 'storybook/test'
import { FilePathInput } from './FilePathInput'

const meta: Meta<typeof FilePathInput> = {
  title: 'Primitives/Forms/FilePathInput',
  component: FilePathInput,
  decorators: [(Story) => <div style={{ width: 360 }}><Story /></div>],
  argTypes: {
    disabled: { control: 'boolean' },
    accept: { control: 'text' },
  },
  args: { onChange: fn() },
}
export default meta
type Story = StoryObj<typeof FilePathInput>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Drop a file, or click to browse/i)).toBeInTheDocument()
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: 'C:\\Users\\you\\Documents\\export.csv',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('export.csv')).toBeInTheDocument()
  },
}

export const Disabled: Story = {
  args: {
    defaultValue: '/home/you/data/dump.sql',
    disabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('dump.sql')).toBeInTheDocument()
  },
}

export const RestrictedToCsvJson: Story = {
  args: {
    accept: '.csv,.json',
  },
}
