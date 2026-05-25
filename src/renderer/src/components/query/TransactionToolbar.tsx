import { Flex, Button, Badge, Select } from '@/primitives'
import { Switch } from '@/primitives/forms/Switch'
import type { DriverCapabilities } from '@/stores/driver-capabilities'
import type { QueryTabTxnState } from '@shared/types'

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
  // No transaction UX to show
  if (!caps?.autoCommit && !caps?.manualTransactions) return null

  const txnLabel = caps.transactionLabel ?? 'Transaction'
  const rollbackLabel = caps.rollbackKind === 'discard' ? 'Discard' : 'Rollback'
  const isActive = txn.status === 'active'

  const statusBadgeVariant = isActive ? 'warning' : 'default'
  const statusText = isActive
    ? `${txnLabel} active`
    : txn.autoCommit
      ? 'Auto-commit'
      : 'Idle'

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
            label="Auto-commit"
            checked={txn.autoCommit}
            onChange={(e) => onToggleAutoCommit(e.target.checked)}
          />
          <span className="text-xs text-text-secondary">Auto-commit</span>
        </label>
      )}

      {/* Isolation level select */}
      {isolationOptions.length > 0 && (
        <Select
          aria-label="Isolation level"
          value={txn.isolationLevel ?? ''}
          onChange={(value) => onIsolationChange?.(value)}
          options={isolationOptions}
          size="xs"
          className="w-44"
        />
      )}

      {/* Read-only toggle */}
      {caps.readOnly && (
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <Switch
            label="Read-only"
            checked={txn.readOnly}
            onChange={(e) => onReadOnlyChange?.(e.target.checked)}
          />
          <span className="text-xs text-text-secondary">Read-only</span>
        </label>
      )}

      {/* Commit / Rollback */}
      {caps.manualTransactions && (
        <Flex direction="row" align="center" gap="xs">
          <Button
            variant="outline"
            size="xs"
            disabled={!isActive}
            onClick={onCommit}
            className="bg-success/10 text-success hover:bg-success/20 border-0 disabled:opacity-40"
          >
            Commit
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={!isActive}
            onClick={onRollback}
            className="bg-error/10 text-error hover:bg-error/20 border-0 disabled:opacity-40"
          >
            {rollbackLabel}
          </Button>
        </Flex>
      )}
    </Flex>
  )
}
