// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from '@arshad-shah/cynosure-react/input'
import {
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
} from '@arshad-shah/cynosure-react/form'

/**
 * Stage 5c of the Cynosure migration replaced Verql's FormField wrapper with
 * Cynosure's form composition (docs/cynosure-migration.md). Pins the wiring
 * call sites rely on: FormControl injects the field id so FormLabel
 * associates, and description/message register on aria-describedby.
 */
describe('Cynosure form composition (migration contract)', () => {
  it('renders label and control, wired by the field id', () => {
    const { container } = render(
      <FormField>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input placeholder="Enter email" />
        </FormControl>
      </FormField>,
    )
    expect(screen.getByText('Email')).toBeInTheDocument()
    const label = container.querySelector('label')
    const input = container.querySelector('input')
    expect(label?.htmlFor).toBeTruthy()
    expect(label?.htmlFor).toBe(input?.id)
  })

  it('announces the description through aria-describedby', () => {
    const { container } = render(
      <FormField>
        <FormLabel>Password</FormLabel>
        <FormControl>
          <Input />
        </FormControl>
        <FormDescription>Must be at least 8 characters</FormDescription>
      </FormField>,
    )
    const input = container.querySelector('input')
    const desc = screen.getByText('Must be at least 8 characters')
    expect(input?.getAttribute('aria-describedby')).toContain(desc.id)
  })

  it('renders the validation message only when content exists', () => {
    render(
      <FormField invalid>
        <FormControl>
          <Input />
        </FormControl>
        <FormMessage>Invalid email</FormMessage>
      </FormField>,
    )
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
  })
})
