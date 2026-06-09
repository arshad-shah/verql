import { Modal, Stack, Flex } from '@/primitives'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Button } from '@arshad-shah/cynosure-react/button'
import { ConfirmDialog } from './ConfirmDialog'
import { tabActions } from '@/stores/tab-actions'
import { notifyError } from '@/lib/notify-error'
import { useTranslation } from '@/i18n/I18nProvider'

interface Props {
  pendingCloseId: string | null
  clearPendingClose: () => void
  closeTab: (id: string) => void
}

/** Guards tab closing: when the tab has an open transaction the user must
 *  Commit or Rollback first (a failed op keeps the dialog open to avoid an
 *  orphaned server transaction); otherwise a standard unsaved-changes confirm. */
export function TabCloseGuard({ pendingCloseId, clearPendingClose, closeTab }: Props) {
  const { t } = useTranslation()

  if (pendingCloseId !== null && tabActions.hasOpenTransaction(pendingCloseId)) {
    // Transaction close-guard: user must Commit or Rollback before the tab closes.
    // Uses the same Modal/Button/Text/Stack/Flex primitives as ConfirmDialog.
    return (
      <Modal open onClose={clearPendingClose} className="w-[400px] max-w-[90vw]">
        <Stack gap="md" className="p-4">
          <Text size="sm" weight="semibold">{t('shell.confirmTransaction.title')}</Text>
          <Text size="sm" color="fg.muted">
            {t('shell.confirmTransaction.message', {
              label: tabActions.get(pendingCloseId)?.label ?? t('shell.confirmTransaction.thisTab'),
            })}
          </Text>
        </Stack>
        <Flex direction="row" justify="end" gap="sm" className="px-4 py-3 border-t border-border">
          <Button variant="outline" colorScheme="neutral" size="sm" onClick={clearPendingClose}>{t('common.cancel')}</Button>
          <Button
            colorScheme="danger"
            size="sm"
            onClick={async () => {
              const id = pendingCloseId
              if (!id) return
              try {
                await tabActions.rollbackTransaction(id)
                clearPendingClose()
                closeTab(id)
              } catch (err) {
                notifyError(err, {
                  source: { type: 'tab', id, label: tabActions.get(id)?.label ?? id },
                })
                // leave dialog open so the user can retry or cancel
              }
            }}
          >
            {t('shell.confirmTransaction.rollbackAndClose')}
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              const id = pendingCloseId
              if (!id) return
              try {
                await tabActions.commitTransaction(id)
                clearPendingClose()
                closeTab(id)
              } catch (err) {
                notifyError(err, {
                  source: { type: 'tab', id, label: tabActions.get(id)?.label ?? id },
                })
                // leave dialog open so the user can retry or cancel
              }
            }}
          >
            {t('shell.confirmTransaction.commitAndClose')}
          </Button>
        </Flex>
      </Modal>
    )
  }

  return (
    <ConfirmDialog
      open={pendingCloseId !== null}
      title={t('shell.confirmClose.unsavedTitle')}
      message={(() => {
        if (!pendingCloseId) return ''
        const label = tabActions.get(pendingCloseId)?.label ?? t('shell.confirmClose.thisTab')
        return t('shell.confirmClose.unsavedMessage', { label })
      })()}
      confirmLabel={t('shell.confirmClose.discardChanges')}
      cancelLabel={t('shell.confirmClose.keepEditing')}
      variant="danger"
      onCancel={clearPendingClose}
      onConfirm={() => {
        const id = pendingCloseId
        clearPendingClose()
        if (id) closeTab(id)
      }}
    />
  )
}
