import type { Meta, StoryObj } from '@storybook/react'
import { Radio } from './Radio'

const meta = {
  title: 'Forms/Radio',
  component: Radio,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Radio>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    name: 'playground',
    value: 'option',
  },
}

export const RadioGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB'].map((db, i) => (
        <label key={db} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-primary)', cursor: 'pointer' }}>
          <Radio name="db" value={db.toLowerCase()} defaultChecked={i === 0} />
          {db}
        </label>
      ))}
    </div>
  ),
}
