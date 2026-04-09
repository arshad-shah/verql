import { describe, it, expect, beforeEach } from 'vitest'
import { useNotificationsStore } from '../../../src/renderer/src/stores/notifications'

describe('useNotificationsStore', () => {
  beforeEach(() => {
    useNotificationsStore.setState({
      notifications: [],
      panelOpen: false,
    })
  })

  it('starts with empty notifications and panel closed', () => {
    const state = useNotificationsStore.getState()
    expect(state.notifications).toEqual([])
    expect(state.panelOpen).toBe(false)
  })

  it('adds a notification with generated id, timestamp, and read=false', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', message: 'Query failed' })
    const { notifications } = useNotificationsStore.getState()
    expect(notifications).toHaveLength(1)
    expect(notifications[0].type).toBe('error')
    expect(notifications[0].message).toBe('Query failed')
    expect(notifications[0].read).toBe(false)
    expect(notifications[0].id).toBeDefined()
    expect(notifications[0].timestamp).toBeGreaterThan(0)
  })

  it('adds notification with optional source', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({
      type: 'info',
      message: 'Connected',
      source: { type: 'connection', id: 'c1', label: 'My DB' },
    })
    const { notifications } = useNotificationsStore.getState()
    expect(notifications[0].source).toEqual({ type: 'connection', id: 'c1', label: 'My DB' })
  })

  it('prepends new notifications (newest first)', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'info', message: 'First' })
    addNotification({ type: 'error', message: 'Second' })
    const { notifications } = useNotificationsStore.getState()
    expect(notifications[0].message).toBe('Second')
    expect(notifications[1].message).toBe('First')
  })

  it('prunes oldest when exceeding 50 notifications', () => {
    const { addNotification } = useNotificationsStore.getState()
    for (let i = 0; i < 52; i++) {
      addNotification({ type: 'info', message: `Notification ${i}` })
    }
    const { notifications } = useNotificationsStore.getState()
    expect(notifications).toHaveLength(50)
    expect(notifications[0].message).toBe('Notification 51')
  })

  it('marks a single notification as read', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', message: 'Fail' })
    const id = useNotificationsStore.getState().notifications[0].id
    useNotificationsStore.getState().markRead(id)
    expect(useNotificationsStore.getState().notifications[0].read).toBe(true)
  })

  it('marks all notifications as read', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', message: 'One' })
    addNotification({ type: 'info', message: 'Two' })
    useNotificationsStore.getState().markAllRead()
    const { notifications } = useNotificationsStore.getState()
    expect(notifications.every(n => n.read)).toBe(true)
  })

  it('clears all notifications', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', message: 'One' })
    addNotification({ type: 'info', message: 'Two' })
    useNotificationsStore.getState().clearAll()
    expect(useNotificationsStore.getState().notifications).toEqual([])
  })

  it('toggles panel open/closed', () => {
    const { togglePanel } = useNotificationsStore.getState()
    togglePanel()
    expect(useNotificationsStore.getState().panelOpen).toBe(true)
    togglePanel()
    expect(useNotificationsStore.getState().panelOpen).toBe(false)
  })

  it('closes panel explicitly', () => {
    useNotificationsStore.setState({ panelOpen: true })
    useNotificationsStore.getState().closePanel()
    expect(useNotificationsStore.getState().panelOpen).toBe(false)
  })

  it('computes unread count', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', message: 'One' })
    addNotification({ type: 'info', message: 'Two' })
    addNotification({ type: 'info', message: 'Three' })
    expect(useNotificationsStore.getState().unreadCount()).toBe(3)
    const id = useNotificationsStore.getState().notifications[0].id
    useNotificationsStore.getState().markRead(id)
    expect(useNotificationsStore.getState().unreadCount()).toBe(2)
  })
})
