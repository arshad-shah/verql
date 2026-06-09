import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Input } from '@arshad-shah/cynosure-react/input'
import { FormField } from '../../../../src/renderer/src/primitives/forms/FormField'

describe('FormField', () => {
  it('renders label and children', () => {
    render(
      <FormField label="Email">
        <Input placeholder="Enter email" />
      </FormField>
    )
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(
      <FormField label="Email" error="Invalid email">
        <Input />
      </FormField>
    )
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
  })

  it('renders hint message', () => {
    render(
      <FormField label="Password" hint="Must be at least 8 characters">
        <Input />
      </FormField>
    )
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument()
  })

  it('connects label htmlFor to input id', () => {
    const { container } = render(
      <FormField label="Name">
        <Input />
      </FormField>
    )
    const label = container.querySelector('label')
    const input = container.querySelector('input')
    expect(label?.htmlFor).toBeTruthy()
    expect(label?.htmlFor).toBe(input?.id)
  })
})
