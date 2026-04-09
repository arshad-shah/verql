import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { useState } from 'react'
import { FormField } from '../forms/FormField'
import { Input } from '../forms/Input'
import { PasswordInput } from '../forms/PasswordInput'
import { Select } from '../forms/Select'
import { Button } from '../forms/Button'
import { NumberInput } from '../forms/NumberInput'

const onTest = fn()
const onConnect = fn()
const onSqliteTest = fn()
const onSqliteConnect = fn()

const meta: Meta = {
  title: 'Patterns/ConnectionForm',
  tags: ['autodocs'],
}
export default meta

export const Default: StoryObj = {
  render: function Render() {
    const [dbType, setDbType] = useState('postgresql')
    return (
      <div className="w-96 rounded-lg border border-border-default bg-bg-secondary p-6 shadow-card">
        <h3 className="text-lg font-semibold text-text-primary mb-4">New Connection</h3>
        <div className="flex flex-col gap-4">
          <FormField label="Database Type">
            <Select value={dbType} onChange={(e) => setDbType(e.target.value)}>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="mongodb">MongoDB</option>
            </Select>
          </FormField>
          <FormField label="Host">
            <Input placeholder="localhost" defaultValue="localhost" />
          </FormField>
          <FormField label="Port">
            <NumberInput defaultValue={5432} min={1} max={65535} />
          </FormField>
          <FormField label="Database">
            <Input placeholder="mydb" />
          </FormField>
          <FormField label="Username">
            <Input placeholder="postgres" />
          </FormField>
          <FormField label="Password">
            <PasswordInput placeholder="Enter password" showStrength />
          </FormField>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={onTest}>Test</Button>
            <Button variant="solid" className="flex-1" onClick={onConnect}>Connect</Button>
          </div>
        </div>
      </div>
    )
  },
  play: async ({ canvas }) => {
    const testBtn = canvas.getByRole('button', { name: 'Test' })
    await userEvent.click(testBtn)
    await expect(onTest).toHaveBeenCalledTimes(1)

    const connectBtn = canvas.getByRole('button', { name: 'Connect' })
    await userEvent.click(connectBtn)
    await expect(onConnect).toHaveBeenCalledTimes(1)
  },
}

export const States: StoryObj = {
  render: function Render() {
    return (
      <div className="w-96 rounded-lg border border-border-default bg-bg-secondary p-6 shadow-card">
        <h3 className="text-lg font-semibold text-text-primary mb-4">New Connection</h3>
        <div className="flex flex-col gap-4">
          <FormField label="Database Type">
            <Select value="sqlite" onChange={() => {}}>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="mongodb">MongoDB</option>
            </Select>
          </FormField>
          <FormField label="Database File">
            <Input placeholder="/path/to/database.sqlite" />
          </FormField>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={onSqliteTest}>Test</Button>
            <Button variant="solid" className="flex-1" onClick={onSqliteConnect}>Connect</Button>
          </div>
        </div>
      </div>
    )
  },
  play: async ({ canvas }) => {
    const testBtn = canvas.getByRole('button', { name: 'Test' })
    await userEvent.click(testBtn)
    await expect(onSqliteTest).toHaveBeenCalledTimes(1)

    const connectBtn = canvas.getByRole('button', { name: 'Connect' })
    await userEvent.click(connectBtn)
    await expect(onSqliteConnect).toHaveBeenCalledTimes(1)
  },
}
