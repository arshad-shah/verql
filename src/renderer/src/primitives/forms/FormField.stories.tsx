import type { Meta, StoryObj } from '@storybook/react'
import { FormField } from './FormField'
import { Input } from './Input'

const meta: Meta<typeof FormField> = {
  title: 'Primitives/Forms/FormField',
  component: FormField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    hint: { control: 'text' },
  },
}
export default meta
type Story = StoryObj<typeof FormField>

export const Default: Story = {
  args: {
    label: 'Database host',
    hint: 'Enter the hostname or IP address',
    children: <Input placeholder="localhost" />,
  },
  decorators: [(Story) => <div style={{ width: 280 }}><Story /></div>],
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6" style={{ width: 280 }}>
      <FormField label="Port" error="Port must be between 1 and 65535">
        <Input placeholder="5432" error />
      </FormField>
      <FormField hint="This field is optional">
        <Input placeholder="Optional field" />
      </FormField>
    </div>
  ),
}
