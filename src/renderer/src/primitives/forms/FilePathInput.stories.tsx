import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { FilePathInput } from './FilePathInput'

const meta: Meta<typeof FilePathInput> = {
  title: 'Primitives/Forms/FilePathInput',
  component: FilePathInput,
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    accept: { control: 'text' },
  },
  args: { onChange: fn() },
}
export default meta
type Story = StoryObj<typeof FilePathInput>

export const Default: Story = {
  args: {
    size: 'md',
    placeholder: 'No file selected',
    style: { width: 360 },
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: 'C:\\Users\\you\\Documents\\export.csv',
    style: { width: 360 },
  },
}

export const Disabled: Story = {
  args: {
    defaultValue: '/home/you/data/dump.sql',
    disabled: true,
    style: { width: 360 },
  },
}

export const RestrictedToCsvJson: Story = {
  args: {
    accept: '.csv,.json',
    placeholder: 'Pick a .csv or .json file',
    style: { width: 360 },
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3" style={{ width: 360 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <FilePathInput key={size} size={size} placeholder={`size="${size}"`} />
      ))}
    </div>
  ),
}
