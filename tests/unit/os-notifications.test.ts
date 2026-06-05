import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createNotificationDispatcher,
  type NativeNotifier,
  type NativeNotificationHandle,
  type NotificationSettings,
} from '../../src/main/plugins/bundled/os-notifications/dispatcher'

/** A fake native layer that records what would have been presented. */
function makeNative(overrides: Partial<NativeNotifier> = {}) {
  const presented: Array<{ title: string; body?: string; onClick?: () => void; handle: NativeNotificationHandle }> = []
  const native: NativeNotifier = {
    isSupported: () => true,
    isAnyWindowFocused: () => false,
    focusPrimaryWindow: vi.fn(),
    present: (opts) => {
      const handle: NativeNotificationHandle = { close: vi.fn() }
      presented.push({ ...opts, handle })
      return handle
    },
    ...overrides,
  }
  return { native, presented }
}

function makeSettings(overrides: Partial<Record<keyof NotificationSettings, boolean>> = {}): NotificationSettings {
  const v = { enabled: true, onlyWhenUnfocused: true, notifyApprovals: true, ...overrides }
  return {
    enabled: () => v.enabled,
    onlyWhenUnfocused: () => v.onlyWhenUnfocused,
    notifyApprovals: () => v.notifyApprovals,
  }
}

describe('os-notifications dispatcher', () => {
  let native: ReturnType<typeof makeNative>

  beforeEach(() => {
    native = makeNative()
  })

  it('is unavailable when the user disabled notifications', () => {
    const d = createNotificationDispatcher({ native: native.native, settings: makeSettings({ enabled: false }) })
    expect(d.isAvailable()).toBe(false)
    d.notify({ title: 'x' })
    expect(native.presented).toHaveLength(0)
  })

  it('is unavailable when the OS does not support notifications', () => {
    const n = makeNative({ isSupported: () => false })
    const d = createNotificationDispatcher({ native: n.native, settings: makeSettings() })
    expect(d.isAvailable()).toBe(false)
  })

  it('skips notifying while a window is focused when onlyWhenUnfocused is set', () => {
    const n = makeNative({ isAnyWindowFocused: () => true })
    const d = createNotificationDispatcher({ native: n.native, settings: makeSettings({ onlyWhenUnfocused: true }) })
    d.notify({ title: 'x' })
    expect(n.presented).toHaveLength(0)
  })

  it('notifies while focused when onlyWhenUnfocused is off', () => {
    const n = makeNative({ isAnyWindowFocused: () => true })
    const d = createNotificationDispatcher({ native: n.native, settings: makeSettings({ onlyWhenUnfocused: false }) })
    d.notify({ title: 'Heads up' })
    expect(n.presented).toHaveLength(1)
    expect(n.presented[0].title).toBe('Heads up')
  })

  it('defaults the click handler to focusing the primary window', () => {
    const d = createNotificationDispatcher({ native: native.native, settings: makeSettings() })
    d.notify({ title: 'x' })
    native.presented[0].onClick?.()
    expect(native.native.focusPrimaryWindow).toHaveBeenCalledTimes(1)
  })

  it('uses a custom click handler when provided', () => {
    const d = createNotificationDispatcher({ native: native.native, settings: makeSettings() })
    const onClick = vi.fn()
    d.notify({ title: 'x', onClick })
    native.presented[0].onClick?.()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(native.native.focusPrimaryWindow).not.toHaveBeenCalled()
  })

  it('replaces a prior notification carrying the same id', () => {
    const d = createNotificationDispatcher({ native: native.native, settings: makeSettings() })
    d.notify({ title: 'first', id: 'req-1' })
    d.notify({ title: 'second', id: 'req-1' })
    // The first native handle should have been closed when the second arrived.
    expect(native.presented[0].handle.close).toHaveBeenCalledTimes(1)
    expect(native.presented).toHaveLength(2)
  })

  describe('attention events', () => {
    it('surfaces an approval request as a critical notification', () => {
      const d = createNotificationDispatcher({ native: native.native, settings: makeSettings() })
      d.handleAttention({
        type: 'requested',
        request: { id: 'a1', kind: 'approval', title: 'Approve?', body: 'DELETE FROM t' },
      })
      expect(native.presented).toHaveLength(1)
      expect(native.presented[0].urgency).toBe('critical')
    })

    it('does not surface approvals when notifyApprovals is off', () => {
      const d = createNotificationDispatcher({ native: native.native, settings: makeSettings({ notifyApprovals: false }) })
      d.handleAttention({ type: 'requested', request: { id: 'a1', kind: 'approval', title: 'Approve?' } })
      expect(native.presented).toHaveLength(0)
    })

    it('dismisses the notification when the attention is resolved', () => {
      const d = createNotificationDispatcher({ native: native.native, settings: makeSettings() })
      d.handleAttention({ type: 'requested', request: { id: 'a1', kind: 'approval', title: 'Approve?' } })
      d.handleAttention({ type: 'resolved', id: 'a1' })
      expect(native.presented[0].handle.close).toHaveBeenCalledTimes(1)
    })

    it('surfaces non-approval alerts without requiring the approval toggle', () => {
      const d = createNotificationDispatcher({ native: native.native, settings: makeSettings({ notifyApprovals: false }) })
      d.handleAttention({ type: 'requested', request: { id: 'n1', kind: 'alert', title: 'Something happened' } })
      expect(native.presented).toHaveLength(1)
    })
  })

  it('closes all open notifications on dispose', () => {
    const d = createNotificationDispatcher({ native: native.native, settings: makeSettings() })
    d.notify({ title: 'one', id: 'x1' })
    d.notify({ title: 'two', id: 'x2' })
    d.dispose()
    expect(native.presented[0].handle.close).toHaveBeenCalledTimes(1)
    expect(native.presented[1].handle.close).toHaveBeenCalledTimes(1)
  })
})
