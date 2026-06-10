import { useState } from 'react'
import type { ConnectionProfile } from '@shared/types'
import { Stack } from '@arshad-shah/cynosure-react/stack'
import { Alert, AlertTitle, AlertDescription } from '@arshad-shah/cynosure-react/alert'
import { Button } from '@arshad-shah/cynosure-react/button'
import { IPC_CHANNELS } from '@shared/ipc'
import { useTranslation } from '@/i18n/I18nProvider'

interface Props {
  profile: ConnectionProfile
}

export function ConnectionTestButton({ profile }: Props) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const test = async () => {
    setStatus('testing')
    const result = await window.electronAPI.invoke(IPC_CHANNELS.DB_TEST_CONNECTION, profile)
    if (result.success) {
      setStatus('success')
      const parts = [result.version ?? t('connections.test.connected')]
      if (result.details) {
        for (const [k, v] of Object.entries(result.details)) {
          parts.push(`${k}: ${v}`)
        }
      }
      setMessage(parts.join(' | '))
    } else {
      setStatus('error')
      setMessage(result.error ?? t('connections.connectionFailed'))
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <Stack gap="2">
      <div>
        <Button
          variant="outline"
          colorScheme="neutral"
          size="lg"
          onClick={test}
          loading={status === 'testing'}
        >
          {t('connections.test.button')}
        </Button>
      </div>
      {status === 'success' && (
        <Alert status="success">
          <AlertTitle>{t('connections.test.successTitle')}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {status === 'error' && (
        <Alert status="danger">
          <AlertTitle>{t('connections.test.failedTitle')}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </Stack>
  )
}
