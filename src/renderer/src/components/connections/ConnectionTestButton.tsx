import { useState } from 'react'
import type { ConnectionProfile } from '@shared/types'
import { Stack, Button, Spinner, Alert } from '@/primitives'

interface Props {
  profile: ConnectionProfile
}

export function ConnectionTestButton({ profile }: Props) {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const test = async () => {
    setStatus('testing')
    const result = await window.electronAPI.invoke('db:test-connection', profile)
    if (result.success) {
      setStatus('success')
      const parts = [result.version ?? 'Connected']
      if (result.details) {
        for (const [k, v] of Object.entries(result.details)) {
          parts.push(`${k}: ${v}`)
        }
      }
      setMessage(parts.join(' | '))
    } else {
      setStatus('error')
      setMessage(result.error ?? 'Connection failed')
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <Stack gap="sm">
      <div>
        <Button
          variant="outline"
          size="lg"
          onClick={test}
          disabled={status === 'testing'}
          className="flex items-center gap-1.5"
        >
          {status === 'testing' ? <Spinner size="xs" /> : null}
          Test Connection
        </Button>
      </div>
      {status === 'success' && (
        <Alert variant="success" title="Connection successful">{message}</Alert>
      )}
      {status === 'error' && (
        <Alert variant="error" title="Connection failed">{message}</Alert>
      )}
    </Stack>
  )
}
