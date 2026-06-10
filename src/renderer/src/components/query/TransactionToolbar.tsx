import { Flex, Badge } from '@/primitives'
import { Button } from '@arshad-shah/cynosure-react/button'
import { Switch } from '@arshad-shah/cynosure-react/switch'
import { Select } from '@arshad-shah/cynosure-react/select'
import { VisuallyHidden } from '@arshad-shah/cynosure-react'
import type { DriverCapabilities } from '@/stores/driver-capabilities'
import type { QueryTabTxnState } from '@shared/types'
import { useTranslation } from '@/i18n/I18nProvider'

export interface TransactionToolbarProps {
  caps: DriverCapabilities['session'] | undefined
  txn: QueryTabTxnState
  onToggleAutoCommit: (enabled: boolean) => void
  onCommit: () => void
  onRollback: () => void
  onIsolationChange?: (level: string) => void
  onReadOnlyChange?: (readOnly: boolean) => void
}

export function TransactionToolbar({
  caps,
  txn,
  onToggleAutoCommit,
  onCommit,
  onRollback,
  onIsolationChange,
  onReadOnlyChange,
}: TransactionToolbarProps) {
  const { t } = useTranslation()
  // No transaction UX to show
  if (!caps?.autoCommit && !caps?.manualTransactions) return null

  const txnLabel = caps.transactionLabel ?? t('query.txn.transaction')
  const rollbackLabel = caps.rollbackKind === 'discard' ? t('query.txn.discard') : t('query.txn.rollback')
  const isActive = txn.status === 'active'

  const statusBadgeVariant = isActive ? 'warning' : 'default'
  const statusText = isActive
    ? t('query.txn.statusActive', { label: txnLabel })
    : txn.autoCommit
      ? t('query.txn.statusAutoCommit')
      : t('query.txn.statusIdle')

  const isolationOptions = (caps.isolationLevels ?? []).map((level) => ({
    value: level,
    label: level,
  }))

  return (
    <Flex direction="row" align="center" gap="sm" className="flex-wrap">
      {/* Status badge */}
      <Badge variant={statusBadgeVariant} size="sm">
        {statusText}
      </Badge>

      {/* Auto-commit toggle */}
      {caps.autoCommit && (
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <Switch
            checked={txn.autoCommit}
            onCheckedChange={onToggleAutoCommit}
          >
            <VisuallyHidden>{t('query.txn.autoCommit')}</VisuallyHidden>
          </Switch>
          <span className="text-xs text-text-secondary">{t('query.txn.autoCommit')}</span>
        </label>
      )}

      {/* Isolation level select — disabled while a transaction is active because
          the setting only takes effect at the next BEGIN; changing it mid-txn
          would silently no-op and mislead the user. */}
      {isolationOptions.length > 0 && (
        <Select
          aria-label={t('query.txn.isolationLevel')}
          value={txn.isolationLevel ?? ''}
          onValueChange={(value) => onIsolationChange?.(value)}
          items={isolationOptions}
          size="sm"
          className="w-44"
          disabled={isActive}
        />
      )}

      {/* Read-only toggle — disabled while a transaction is active for the same
          reason: it only applies at the next BEGIN. */}
      {caps.readOnly && (
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <Switch
            checked={txn.readOnly}
            onCheckedChange={(checked) => onReadOnlyChange?.(checked)}
            disabled={isActive}
          >
            <VisuallyHidden>{t('query.txn.readOnly')}</VisuallyHidden>
          </Switch>
          <span className="text-xs text-text-secondary">{t('query.txn.readOnly')}</span>
        </label>
      )}

      {/* Commit / Rollback */}
      {caps.manualTransactions && (
        <Flex direction="row" align="center" gap="xs">
          <Button
            variant="soft"
            colorScheme="success"
            size="xs"
            disabled={!isActive}
            onClick={onCommit}
          >
            {t('query.txn.commit')}
          </Button>
          <Button
            variant="soft"
            colorScheme="danger"
            size="xs"
            disabled={!isActive}
            onClick={onRollback}
          >
            {rollbackLabel}
          </Button>
        </Flex>
      )}
    </Flex>
  )
}
