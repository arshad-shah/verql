import { useEffect, useRef, useState } from 'react'
import { useNotificationsStore } from '@/stores/notifications'
import { IPC_CHANNELS } from '@shared/ipc'

export interface PluginStatus {
  total: number
  active: number
  failed: number
  loading: boolean
}

const TRANSITIONAL = new Set(['activating', 'discovered', 'validated', 'resolved'])
const HEALTHY = new Set(['active', 'degraded'])

export function usePluginStatus(): PluginStatus {
  const [status, setStatus] = useState<PluginStatus>({
    total: 0, active: 0, failed: 0, loading: true,
  })
  const notifiedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const list = (await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_LIST)) as Array<{
          status: { state: string }
        }>
        if (cancelled) return
        const loading = list.some((p) => TRANSITIONAL.has(p.status.state))
        const active = list.filter((p) => HEALTHY.has(p.status.state)).length
        const failed = list.filter((p) => p.status.state === 'error').length
        setStatus({ total: list.length, active, failed, loading })

        if (failed > 0 && !notifiedRef.current) {
          notifiedRef.current = true
          useNotificationsStore.getState().addNotification({
            type: 'warning',
            title: 'Plugin load failure',
            message: `${failed} plugin(s) failed to load`,
            source: { type: 'plugin', id: 'system', label: 'Plugin system' },
          })
        }
      } catch {
        if (!cancelled) setStatus({ total: 0, active: 0, failed: 0, loading: false })
      }
    }

    check()
    const interval = setInterval(check, 2000)
    const timeout = setTimeout(() => clearInterval(interval), 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  return status
}
