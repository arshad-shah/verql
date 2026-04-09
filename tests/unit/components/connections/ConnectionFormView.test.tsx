import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConnectionFormView } from '../../../../src/renderer/src/components/connections/ConnectionFormView'

// Mock electronAPI
const mockInvoke = vi.fn().mockResolvedValue([])
const mockOn = vi.fn().mockReturnValue(vi.fn())
Object.defineProperty(window, 'electronAPI', {
  value: { invoke: mockInvoke, on: mockOn },
  writable: true
})

// Mock stores
const mockSaveConnection = vi.fn().mockResolvedValue(undefined)
const mockCloseTab = vi.fn()
const mockConnections: any[] = []

vi.mock('../../../../src/renderer/src/stores/connections', () => ({
  useConnectionsStore: (selector: any) => selector({
    connections: mockConnections,
    saveConnection: mockSaveConnection
  })
}))

vi.mock('../../../../src/renderer/src/stores/tabs', () => ({
  useTabsStore: (selector: any) => selector({
    closeTab: mockCloseTab
  })
}))

describe('ConnectionFormView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue([])
  })

  it('renders the new connection heading', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    expect(screen.getByText('New Connection')).toBeTruthy()
  })

  it('renders database type select', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    const select = screen.getByLabelText('Database Type')
    expect(select).toBeTruthy()
    expect(select.tagName).toBe('SELECT')
  })

  it('renders connection name input', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    expect(screen.getByLabelText('Connection Name')).toBeTruthy()
  })

  it('renders host and port for postgresql', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    expect(screen.getByLabelText('Host')).toBeTruthy()
    expect(screen.getByLabelText('Port')).toBeTruthy()
  })

  it('renders password input with visibility toggle', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    expect(screen.getByPlaceholderText('Password')).toBeTruthy()
    expect(screen.getByLabelText('Show password')).toBeTruthy()
  })

  it('renders SSL switch', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    expect(screen.getByRole('switch')).toBeTruthy()
  })

  it('renders cancel and save buttons', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    expect(screen.getByText('Cancel')).toBeTruthy()
    expect(screen.getByText('Add Connection')).toBeTruthy()
  })

  it('shows database file input for sqlite', async () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    const select = screen.getByLabelText('Database Type')
    await userEvent.selectOptions(select, 'sqlite')
    expect(screen.getByLabelText('Database File')).toBeTruthy()
    expect(screen.queryByLabelText('Host')).toBeNull()
  })

  it('closes tab on cancel click', async () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    await userEvent.click(screen.getByText('Cancel'))
    expect(mockCloseTab).toHaveBeenCalledWith('conn-form-new')
  })
})
