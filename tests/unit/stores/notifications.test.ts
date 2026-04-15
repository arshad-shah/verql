import { describe, it, expect, beforeEach } from 'vitest'
import { useNotificationsStore } from '../../../src/renderer/src/stores/notifications'

describe('useNotificationsStore', () => {
  beforeEach(() => {
    useNotificationsStore.setState({
      notifications: [],
    })
  })

  it('starts with empty notifications', () => {
    const state = useNotificationsStore.getState()
    expect(state.notifications).toEqual([])
  })

  it('adds a notification with generated id, timestamp, and read=false', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', title: 'Query failed' })
    const { notifications } = useNotificationsStore.getState()
    expect(notifications).toHaveLength(1)
    expect(notifications[0].type).toBe('error')
    expect(notifications[0].title).toBe('Query failed')
    expect(notifications[0].read).toBe(false)
    expect(notifications[0].id).toBeDefined()
    expect(notifications[0].timestamp).toBeGreaterThan(0)
  })

  it('adds notification with optional message and source', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({
      type: 'info',
      title: 'Connected',
      message: 'Successfully connected to My DB',
      source: { type: 'connection', id: 'c1', label: 'My DB' },
    })
    const { notifications } = useNotificationsStore.getState()
    expect(notifications[0].title).toBe('Connected')
    expect(notifications[0].message).toBe('Successfully connected to My DB')
    expect(notifications[0].source).toEqual({ type: 'connection', id: 'c1', label: 'My DB' })
  })

  it('prepends new notifications (newest first)', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'info', title: 'First' })
    addNotification({ type: 'error', title: 'Second' })
    const { notifications } = useNotificationsStore.getState()
    expect(notifications[0].title).toBe('Second')
    expect(notifications[1].title).toBe('First')
  })

  it('prunes oldest when exceeding 50 notifications', () => {
    const { addNotification } = useNotificationsStore.getState()
    for (let i = 0; i < 52; i++) {
      addNotification({ type: 'info', title: `Notification ${i}` })
    }
    const { notifications } = useNotificationsStore.getState()
    expect(notifications).toHaveLength(50)
    expect(notifications[0].title).toBe('Notification 51')
  })

  it('removes a single notification', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', title: 'Fail' })
    addNotification({ type: 'info', title: 'Info' })
    const id = useNotificationsStore.getState().notifications[0].id
    useNotificationsStore.getState().removeNotification(id)
    const { notifications } = useNotificationsStore.getState()
    expect(notifications).toHaveLength(1)
    expect(notifications[0].title).toBe('Fail')
  })

  it('marks a single notification as read', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', title: 'Fail' })
    const id = useNotificationsStore.getState().notifications[0].id
    useNotificationsStore.getState().markRead(id)
    expect(useNotificationsStore.getState().notifications[0].read).toBe(true)
  })

  it('marks all notifications as read', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', title: 'One' })
    addNotification({ type: 'info', title: 'Two' })
    useNotificationsStore.getState().markAllRead()
    const { notifications } = useNotificationsStore.getState()
    expect(notifications.every(n => n.read)).toBe(true)
  })

  it('clears all notifications', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', title: 'One' })
    addNotification({ type: 'info', title: 'Two' })
    useNotificationsStore.getState().clearAll()
    expect(useNotificationsStore.getState().notifications).toEqual([])
  })

  it('computes unread count', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', title: 'One' })
    addNotification({ type: 'info', title: 'Two' })
    addNotification({ type: 'info', title: 'Three' })
    expect(useNotificationsStore.getState().unreadCount()).toBe(3)
    const id = useNotificationsStore.getState().notifications[0].id
    useNotificationsStore.getState().markRead(id)
    expect(useNotificationsStore.getState().unreadCount()).toBe(2)
  })
})
