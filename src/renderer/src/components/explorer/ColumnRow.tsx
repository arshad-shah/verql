import type { CSSProperties } from 'react'
import { Key, Link, Hash } from 'lucide-react'
import { ContextMenu } from '@/primitives/surfaces/ContextMenu'
import { useClipboard } from '@/hooks/useClipboard'
import { useDataNouns } from '@/hooks/useDataNouns'
import type { SchemaColumn } from '@shared/types'
import { useTranslation } from '@/i18n/I18nProvider'

interface ColumnRowProps {
  column: SchemaColumn
  tableName: string
  connectionId: string
}

// ─── ColumnIcon ────────────────────────────────────────────────────────────────

function ColumnIcon({ column }: { column: SchemaColumn }) {
  if (column.isPrimaryKey) {
    return (
      <span
        className="inline-flex items-center justify-center rounded shrink-0"
        style={{
          width: 18,
          height: 18,
          background: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
          color: 'var(--color-warning)',
        }}
      >
        <Key size={10} />
      </span>
    )
  }

  if (column.isForeignKey) {
    return (
      <span
        className="inline-flex items-center justify-center rounded shrink-0"
        style={{
          width: 18,
          height: 18,
          background: 'color-mix(in srgb, var(--color-info) 10%, transparent)',
          color: 'var(--color-info)',
        }}
      >
        <Link size={10} />
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded shrink-0"
      style={{
        width: 18,
        height: 18,
        background: 'color-mix(in srgb, var(--color-bg-tertiary) 50%, transparent)',
        color: 'var(--color-text-disabled)',
      }}
    >
      <Hash size={10} />
    </span>
  )
}

// ─── ConstraintBadge ───────────────────────────────────────────────────────────

function ConstraintBadge({ column }: { column: SchemaColumn }) {
  if (column.isPrimaryKey) {
    return (
      <span
        className="inline-flex items-center rounded-full px-1.5 text-[9px] font-semibold leading-4 shrink-0"
        style={{
          background: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
          color: 'var(--color-warning)',
        }}
      >
        PK
      </span>
    )
  }

  if (column.isForeignKey) {
    return (
      <span
        className="inline-flex items-center rounded-full px-1.5 text-[9px] font-semibold leading-4 shrink-0"
        style={{
          background: 'color-mix(in srgb, var(--color-info) 10%, transparent)',
          color: 'var(--color-info)',
        }}
      >
        FK
      </span>
    )
  }

  return null
}

// ─── ColumnRow ─────────────────────────────────────────────────────────────────

export function ColumnRow({ column, tableName, connectionId }: ColumnRowProps) {
  const { t } = useTranslation()
  const { copy } = useClipboard()
  const nouns = useDataNouns(connectionId)

  const qualifiedName = `${tableName}.${column.name}`

  const menuItems = [
    {
      label: t('explorer.menu.copyColumnName', { field: nouns.field.one }),
      onSelect: () => copy(column.name, { toast: { key: 'explorer.toast.copiedColumnName', vars: { field: nouns.field.one } } }),
    },
    {
      label: t('explorer.menu.copyQualifiedName'),
      onSelect: () => copy(qualifiedName, { toast: 'explorer.toast.copiedQualifiedName' }),
    },
  ]

  return (
    <ContextMenu items={menuItems}>
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs min-w-0 cursor-default group"
        style={{ '--hover-bg': 'var(--color-hover)' } as CSSProperties}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = 'var(--color-hover)')
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
      >
        <ColumnIcon column={column} />

        <span
          className="flex-1 truncate min-w-0"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {column.name}
        </span>

        <span
          className="text-[10px] shrink-0"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {column.dataType}
        </span>

        <ConstraintBadge column={column} />
      </div>
    </ContextMenu>
  )
}
