import { cn } from '@/primitives/utils/cn'

const DB_ABBREVIATIONS: Record<string, string> = {
  postgresql: 'PG',
  mysql: 'MY',
  sqlite: 'SL',
  mongodb: 'MG',
  redis: 'RD',
}

const DB_TYPE_COLORS: Record<string, string> = {
  postgresql: 'text-accent',
  mysql: 'text-warning',
  sqlite: 'text-info',
  mongodb: 'text-[#ff8c6b]',
  redis: 'text-error',
}

interface ConnectionCardProps {
  isConnected: boolean
  isError: boolean
  dbType: string | null
  dbName: string | null
  schema: string | null
  isOpen: boolean
  onClick: () => void
}

export function ConnectionCard({
  isConnected,
  isError,
  dbType,
  dbName,
  schema,
  isOpen,
  onClick,
}: ConnectionCardProps) {
  const abbreviation = dbType
    ? (DB_ABBREVIATIONS[dbType] ?? dbType.slice(0, 2).toUpperCase())
    : null
  const typeColor = dbType
    ? (DB_TYPE_COLORS[dbType] ?? 'text-text-primary')
    : 'text-text-tertiary'
  const isDisconnected = !isConnected && !isError

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] transition-colors',
        isError
          ? 'border-error/20 bg-error/8 hover:bg-error/12'
          : isOpen
            ? 'border-accent/30 bg-accent/10'
            : 'border-border-default bg-bg-tertiary hover:bg-hover',
        isDisconnected && 'opacity-60'
      )}
    >
      <div
        className={cn(
          'h-[7px] w-[7px] shrink-0 rounded-full',
          isError && 'bg-error shadow-[0_0_4px_rgba(255,95,87,0.4)]',
          isConnected && !isError && 'bg-success shadow-[0_0_4px_rgba(40,200,64,0.4)]',
          isDisconnected && 'bg-text-tertiary'
        )}
      />

      {isConnected || isError ? (
        <>
          <span className={cn('font-semibold', isError ? 'text-error' : typeColor)}>
            {abbreviation}
          </span>
          <span className={cn(isError ? 'text-error' : 'text-text-primary')}>{dbName}</span>
          {isError ? (
            <span className="text-error/60">Connection lost</span>
          ) : (
            schema && <span className="text-text-tertiary">/ {schema}</span>
          )}
        </>
      ) : (
        <span className="text-text-tertiary">No connection</span>
      )}

      <span className={cn('ml-0.5 text-[8px]', isOpen ? 'text-accent' : 'text-text-disabled')}>
        {isOpen ? '▴' : '▾'}
      </span>
    </button>
  )
}
