import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { useToastStore } from '@/stores/toast'
import { Stack, Flex, Text, IconButton, Box, cn } from '@/primitives'

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
    <Stack gap="sm" className="fixed bottom-10 right-4 z-50 max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <Flex
            key={toast.id}
            align="start"
            gap="sm"
            className={cn(
              'px-3 py-2.5 rounded-lg border backdrop-blur-sm shadow-lg toast-enter',
              styles[toast.type]
            )}
            role="alert"
          >
            <Icon size={16} className={cn('shrink-0 mt-0.5', iconStyles[toast.type])} />
            <Box className="flex-1 min-w-0">
              <Text size="sm" weight="medium" as="p">{toast.title}</Text>
              {toast.message && (
                <Text size="xs" color="secondary" as="p" className="mt-0.5 whitespace-pre-wrap break-words">
                  {toast.message}
                </Text>
              )}
            </Box>
            <IconButton
              label="Dismiss"
              size="xs"
              variant="ghost"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-text-muted hover:text-text-primary p-0.5 h-auto w-auto"
            >
              <X size={14} />
            </IconButton>
          </Flex>
        )
      })}
    </Stack>
  )
}
