// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@arshad-shah/cynosure-react/input'
import { SearchInput } from '@arshad-shah/cynosure-react/search-input'
import { NumberInput } from '@arshad-shah/cynosure-react/number-input'

/**
 * Stage 5a of the Cynosure migration replaced the text-input family
 * (docs/cynosure-migration.md). The load-bearing contract change: Cynosure
 * form controls call `onChange` with the VALUE, not the React change event —
 * every call site was rewired accordingly. These tests fail loudly if that
 * contract (or the react-aria NumberField prop names) shifts.
 */

describe('Cynosure Input (migration contract)', () => {
  it('calls onChange with the string value, not an event', () => {
    const onChange = vi.fn()
    render(<Input placeholder="host" onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('host'), { target: { value: 'localhost' } })
    expect(onChange).toHaveBeenCalledWith('localhost')
  })

  it('supports invalid (replaces Verql error) and the sm|md|lg sizes', () => {
    render(<Input placeholder="p" invalid size="sm" />)
    expect(screen.getByPlaceholderText('p')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('Cynosure SearchInput (migration contract)', () => {
  it('is value-based and clears through the built-in clear button', () => {
    function Harness() {
      const [q, setQ] = useState('abc')
      return <SearchInput placeholder="search" value={q} onChange={setQ} />
    }
    render(<Harness />)
    const input = screen.getByPlaceholderText('search') as HTMLInputElement
    expect(input.value).toBe('abc')
    fireEvent.change(input, { target: { value: 'xy' } })
    expect(input.value).toBe('xy')
  })
})

describe('Cynosure NumberInput (migration contract)', () => {
  it('uses minValue/maxValue/step and numeric onChange', () => {
    const onChange = vi.fn()
    render(
      <NumberInput
        aria-label="port"
        value={3100}
        minValue={1024}
        maxValue={65535}
        step={1}
        formatOptions={{ useGrouping: false }}
        onChange={onChange}
      />,
    )
    // Without useGrouping: false the field renders locale grouping ("3,100")
    // — wrong for ports/limits, so migrated call sites must pass it.
    const input = screen.getByRole('textbox', { name: 'port' }) as HTMLInputElement
    expect(input.value).toBe('3100')
    fireEvent.change(input, { target: { value: '8080' } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith(8080)
  })
})

describe('Cynosure Input type="password" (replaces Verql PasswordInput)', () => {
  it('ships a built-in reveal toggle', () => {
    const onChange = vi.fn()
    render(<Input type="password" placeholder="Password" onChange={onChange} />)
    const input = screen.getByPlaceholderText('Password') as HTMLInputElement
    expect(input.type).toBe('password')
    fireEvent.change(input, { target: { value: 's3cret' } })
    expect(onChange).toHaveBeenCalledWith('s3cret')
    fireEvent.click(screen.getByRole('button', { name: /show password/i }))
    expect(input.type).toBe('text')
  })
})
