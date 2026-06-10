// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { Switch } from '@arshad-shah/cynosure-react/switch'
import { Checkbox } from '@arshad-shah/cynosure-react/checkbox'
import { Select } from '@arshad-shah/cynosure-react/select'
import { VisuallyHidden } from '@arshad-shah/cynosure-react'

/**
 * Stage 5b of the Cynosure migration replaced the choice controls
 * (docs/cynosure-migration.md). Pins the contracts call sites rely on:
 * boolean controls use onCheckedChange(checked), Select is items +
 * onValueChange with section grouping replacing Verql's option groups.
 */

describe('Cynosure Switch (migration contract)', () => {
  it('gets its accessible name from VisuallyHidden children and fires onCheckedChange', () => {
    // Cynosure Switch does NOT forward aria-label — the label must be passed
    // as children; VisuallyHidden keeps it screen-reader-only like Verql's
    // old `label` prop. (Pinned because a silent aria-label drop is exactly
    // the kind of regression this migration must not ship.)
    const onCheckedChange = vi.fn()
    render(
      <Switch checked={false} onCheckedChange={onCheckedChange}>
        <VisuallyHidden>Auto-commit</VisuallyHidden>
      </Switch>,
    )
    const sw = screen.getByRole('switch', { name: 'Auto-commit' })
    fireEvent.click(sw)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})

describe('Cynosure Checkbox (migration contract)', () => {
  it('fires onCheckedChange with the next checked state', () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Include schema" checked={false} onCheckedChange={onCheckedChange} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include schema' }))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})

describe('Cynosure Select (migration contract)', () => {
  const items = [
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON', section: 'Structured' },
  ]

  it('renders items and reports selection through onValueChange', () => {
    const onValueChange = vi.fn()
    render(<Select aria-label="Format" items={items} value="csv" onValueChange={onValueChange} />)
    const trigger = screen.getByRole('button', { name: /format|csv/i })
    fireEvent.click(trigger)
    fireEvent.click(within(screen.getByRole('listbox')).getByText('JSON'))
    expect(onValueChange).toHaveBeenCalledWith('json')
  })
})
