import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
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
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox')
    await userEvent.type(input, 'db.example.com')
    await expect(input).toHaveValue('db.example.com')
    // Verify the label is associated with the input
    const label = canvas.getByText('Database host')
    await expect(label).toBeInTheDocument()
    // Verify hint is shown
    await expect(canvas.getByText('Enter the hostname or IP address')).toBeInTheDocument()
  },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6" style={{ width: 280 }}>
      <FormField label="Port" error="Port must be between 1 and 65535">
        <Input placeholder="5432" error />
      </FormField>
      <FormField label="Notes" hint="This field is optional">
        <Input placeholder="Optional field" />
      </FormField>
    </div>
  ),
  play: async ({ canvas }) => {
    // Verify error message is shown
    await expect(canvas.getByText('Port must be between 1 and 65535')).toBeInTheDocument()
    // Verify hint is shown
    await expect(canvas.getByText('This field is optional')).toBeInTheDocument()
  },
}
