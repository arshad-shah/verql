import { useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { ConnectionProfile } from '@shared/types'

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
    <div className="flex items-center gap-2">
      <button
        onClick={test}
        disabled={status === 'testing'}
        className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        {status === 'testing' ? <Loader2 size={14} className="animate-spin" /> : 'Test Connection'}
      </button>
      {status === 'success' && (
        <span className="text-success text-xs flex items-center gap-1"><CheckCircle size={12} /> {message}</span>
      )}
      {status === 'error' && (
        <span className="text-error text-xs flex items-center gap-1"><XCircle size={12} /> {message}</span>
      )}
    </div>
  )
}
