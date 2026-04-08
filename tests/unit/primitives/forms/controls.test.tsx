import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React, { createRef } from 'react'
import { Select } from '../../../../src/renderer/src/primitives/forms/Select'
import { Checkbox } from '../../../../src/renderer/src/primitives/forms/Checkbox'
import { Radio } from '../../../../src/renderer/src/primitives/forms/Radio'
import { Switch } from '../../../../src/renderer/src/primitives/forms/Switch'
import { Slider } from '../../../../src/renderer/src/primitives/forms/Slider'

describe('Select', () => {
  it('renders a select element', () => {
    const { container } = render(
      <Select>
        <option value="a">Option A</option>
      </Select>
    )
    expect(container.querySelector('select')).toBeInTheDocument()
  })

  it('renders children options', () => {
    render(
      <Select>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </Select>
    )
    expect(screen.getByText('Option A')).toBeInTheDocument()
    expect(screen.getByText('Option B')).toBeInTheDocument()
  })

  it('applies md size by default', () => {
    const { container } = render(<Select><option>A</option></Select>)
    expect(container.firstChild).toHaveClass('h-8')
  })

  it('applies xs size', () => {
    const { container } = render(<Select size="xs"><option>A</option></Select>)
    expect(container.firstChild).toHaveClass('h-6')
  })

  it('applies sm size', () => {
    const { container } = render(<Select size="sm"><option>A</option></Select>)
    expect(container.firstChild).toHaveClass('h-7')
  })

  it('applies lg size', () => {
    const { container } = render(<Select size="lg"><option>A</option></Select>)
    expect(container.firstChild).toHaveClass('h-9')
  })

  it('applies xl size', () => {
    const { container } = render(<Select size="xl"><option>A</option></Select>)
    expect(container.firstChild).toHaveClass('h-10')
  })

  it('applies appearance-none class', () => {
    const { container } = render(<Select><option>A</option></Select>)
    expect(container.firstChild).toHaveClass('appearance-none')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLSelectElement>()
    render(<Select ref={ref}><option>A</option></Select>)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.nodeName).toBe('SELECT')
  })
})

describe('Checkbox', () => {
  it('renders a checkbox input', () => {
    render(<Checkbox />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('can be checked', () => {
    render(<Checkbox defaultChecked />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onChange when clicked', () => {
    const handler = vi.fn()
    render(<Checkbox onChange={handler} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('applies styling classes', () => {
    const { container } = render(<Checkbox />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('h-4')
    expect(input).toHaveClass('w-4')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Checkbox ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.type).toBe('checkbox')
  })
})

describe('Radio', () => {
  it('renders a radio input', () => {
    render(<Radio />)
    expect(screen.getByRole('radio')).toBeInTheDocument()
  })

  it('can be checked', () => {
    render(<Radio defaultChecked />)
    expect(screen.getByRole('radio')).toBeChecked()
  })

  it('applies styling classes', () => {
    const { container } = render(<Radio />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('h-4')
    expect(input).toHaveClass('w-4')
    expect(input).toHaveClass('rounded-full')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Radio ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.type).toBe('radio')
  })
})

describe('Switch', () => {
  it('renders with switch role', () => {
    render(<Switch label="Enable feature" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('sets aria-label from label prop', () => {
    render(<Switch label="Dark mode" />)
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeInTheDocument()
  })

  it('can be toggled', () => {
    render(<Switch label="Toggle" />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).not.toBeChecked()
    fireEvent.click(switchEl)
    expect(switchEl).toBeChecked()
  })

  it('applies sizing classes', () => {
    const { container } = render(<Switch label="Toggle" />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('h-5')
    expect(input).toHaveClass('w-9')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Switch label="Toggle" ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.type).toBe('checkbox')
  })
})

describe('Slider', () => {
  it('renders a range input', () => {
    render(<Slider />)
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('is a range input type', () => {
    const { container } = render(<Slider />)
    const input = container.querySelector('input')
    expect(input?.type).toBe('range')
  })

  it('applies sizing classes', () => {
    const { container } = render(<Slider />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('h-1.5')
    expect(input).toHaveClass('rounded-full')
  })

  it('accepts min, max, and value props', () => {
    render(<Slider min={0} max={100} defaultValue={50} />)
    const slider = screen.getByRole('slider') as HTMLInputElement
    expect(slider.min).toBe('0')
    expect(slider.max).toBe('100')
    expect(slider.value).toBe('50')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Slider ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.type).toBe('range')
  })
})
