import { Modal, Text, Flex, Stack } from '@/primitives'
import { Button } from '@arshad-shah/cynosure-react/button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} className="w-[400px] max-w-[90vw]">
      <Stack gap="md" className="p-4">
        <Text size="sm" weight="semibold">{title}</Text>
        {message && <Text size="sm" color="secondary">{message}</Text>}
      </Stack>
      <Flex direction="row" justify="end" gap="sm" className="px-4 py-3 border-t border-border">
        <Button variant="outline" colorScheme="neutral" size="sm" onClick={onCancel}>{cancelLabel}</Button>
        <Button
          colorScheme={variant === 'danger' ? 'danger' : 'accent'}
          size="sm"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </Flex>
    </Modal>
  )
}
