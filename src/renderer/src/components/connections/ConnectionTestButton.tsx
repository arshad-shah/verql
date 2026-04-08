import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import type { ConnectionProfile } from '@shared/types'
import { Flex, Button, Text, Spinner } from '@/primitives'

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
      setMessage(result.version ?? 'Connected')
    } else {
      setStatus('error')
      setMessage(result.error ?? 'Connection failed')
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <Flex direction="row" align="center" gap="sm">
      <Button
        variant="outline"
        size="sm"
        onClick={test}
        disabled={status === 'testing'}
        className="flex items-center gap-1.5"
      >
        {status === 'testing' ? <Spinner size="xs" /> : null}
        Test Connection
      </Button>
      {status === 'success' && (
        <Flex direction="row" align="center" gap="xs">
          <CheckCircle size={12} className="text-success" />
          <Text size="xs" color="success">{message}</Text>
        </Flex>
      )}
      {status === 'error' && (
        <Flex direction="row" align="center" gap="xs">
          <XCircle size={12} className="text-error" />
          <Text size="xs" color="error">{message}</Text>
        </Flex>
      )}
    </Flex>
  )
}
