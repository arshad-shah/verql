import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileContentInput } from '../../../../src/renderer/src/primitives/forms/FileContentInput'

// Mock electronAPI
const mockInvoke = vi.fn()
Object.defineProperty(window, 'electronAPI', {
  value: { invoke: mockInvoke, on: vi.fn().mockReturnValue(vi.fn()) },
  writable: true
})

describe('FileContentInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders in browse mode by default', () => {
    render(<FileContentInput />)
    expect(screen.getByText('No file selected')).toBeTruthy()
    expect(screen.getByText('Browse')).toBeTruthy()
  })

  it('calls dialog:open-file when browse is clicked', async () => {
    mockInvoke.mockResolvedValue({ filePath: 'id_rsa', content: 'key-content' })
    const onChange = vi.fn()
    render(<FileContentInput onChange={onChange} />)
    await userEvent.click(screen.getByText('Browse'))
    expect(mockInvoke).toHaveBeenCalledWith('dialog:open-file', expect.any(Object))
    expect(onChange).toHaveBeenCalledWith('key-content')
  })

  it('shows filename after file is loaded', async () => {
    mockInvoke.mockResolvedValue({ filePath: 'id_ed25519', content: 'key-data' })
    render(<FileContentInput />)
    await userEvent.click(screen.getByText('Browse'))
    expect(screen.getByText('id_ed25519')).toBeTruthy()
    expect(screen.getByText('loaded')).toBeTruthy()
  })

  it('does not update on cancelled dialog', async () => {
    mockInvoke.mockResolvedValue({ cancelled: true })
    const onChange = vi.fn()
    render(<FileContentInput onChange={onChange} />)
    await userEvent.click(screen.getByText('Browse'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('No file selected')).toBeTruthy()
  })

  it('clears content when clear button is clicked', async () => {
    mockInvoke.mockResolvedValue({ filePath: 'key.pem', content: 'data' })
    const onChange = vi.fn()
    render(<FileContentInput onChange={onChange} />)
    await userEvent.click(screen.getByText('Browse'))
    const clearBtn = screen.getByLabelText('Clear')
    await userEvent.click(clearBtn)
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(screen.getByText('No file selected')).toBeTruthy()
  })

  it('renders in paste mode and accepts input', async () => {
    const onChange = vi.fn()
    render(<FileContentInput defaultMode="paste" onChange={onChange} />)
    const textarea = screen.getByPlaceholderText('Paste content here...')
    await userEvent.type(textarea, 'pasted-key')
    expect(onChange).toHaveBeenCalled()
  })

  it('renders as disabled', () => {
    render(<FileContentInput disabled />)
    expect(screen.getByText('Browse').closest('button')).toHaveProperty('disabled', true)
  })

  it('shows controlled value content', () => {
    render(<FileContentInput value="some-key-content" />)
    expect(screen.getByText('Pasted content')).toBeTruthy()
    expect(screen.getByText('loaded')).toBeTruthy()
  })
})
