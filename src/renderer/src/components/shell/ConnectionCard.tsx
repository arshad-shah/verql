import { Button, Text } from '@/primitives'
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
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md border p-1 transition-colors',
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
          'h-1.75 w-1.75 shrink-0 rounded-full',
          isError && 'bg-error shadow-[0_0_4px_rgba(255,95,87,0.4)]',
          isConnected && !isError && 'bg-success shadow-[0_0_4px_rgba(40,200,64,0.4)]',
          isDisconnected && 'bg-text-tertiary'
        )}
      />

      {isConnected || isError ? (
        <>
          <Text as="span" weight="semibold" className={cn(isError ? 'text-error' : typeColor)}>
            {abbreviation}
          </Text>
          <Text as="span" className={cn(isError ? 'text-error' : 'text-text-primary')}>{dbName}</Text>
          {isError ? (
            <Text as="span" className="text-error/60">Connection lost</Text>
          ) : (
            schema && <Text as="span" className="text-text-tertiary">/ {schema}</Text>
          )}
        </>
      ) : (
        <Text as="span" className="text-text-tertiary">No connection</Text>
      )}
    </Button>
  )
}
