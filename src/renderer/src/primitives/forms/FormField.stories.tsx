import type { Meta, StoryObj } from '@storybook/react'
import { FormField } from './FormField'
import { Input } from './Input'

const meta = {
  title: 'Forms/FormField',
  component: FormField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    hint: { control: 'text' },
  },
} satisfies Meta<typeof FormField>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    label: 'Database host',
    hint: 'Enter the hostname or IP address',
    children: <Input placeholder="localhost" />,
  },
  decorators: [(Story) => <div style={{ width: 280 }}><Story /></div>],
}

export const WithError: Story = {
  args: {
    label: 'Port',
    error: 'Port must be between 1 and 65535',
    children: <Input placeholder="5432" error />,
  },
  decorators: [(Story) => <div style={{ width: 280 }}><Story /></div>],
}

export const WithoutLabel: Story = {
  args: {
    hint: 'This field is optional',
    children: <Input placeholder="Optional field" />,
  },
  decorators: [(Story) => <div style={{ width: 280 }}><Story /></div>],
}
