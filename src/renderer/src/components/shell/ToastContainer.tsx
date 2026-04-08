import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { useToastStore } from '@/stores/toast'

const icons = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info
}

const styles = {
  error: 'border-error/30 bg-error/10',
  success: 'border-success/30 bg-success/10',
  info: 'border-accent/30 bg-accent/10'
}

const iconStyles = {
  error: 'text-error',
  success: 'text-success',
  info: 'text-accent'
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-10 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border backdrop-blur-sm shadow-lg toast-enter ${styles[toast.type]}`}
            role="alert"
          >
            <Icon size={16} className={`shrink-0 mt-0.5 ${iconStyles[toast.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-text-secondary mt-0.5 whitespace-pre-wrap break-words">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-0.5 text-text-muted hover:text-text-primary rounded"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
