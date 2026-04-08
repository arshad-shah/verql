import { Play, Square, FileSearch } from 'lucide-react'
import { Flex, Button, Text, Spinner, Spacer } from '@/primitives'

interface Props {
  onExecute: () => void
  onCancel: () => void
  onExplain: () => void
  isExecuting: boolean
  duration: number | null
  rowCount: number | null
  error: string | null
}

export function QueryToolbar({ onExecute, onCancel, onExplain, isExecuting, duration, rowCount, error }: Props) {
  return (
    <Flex direction="row" align="center" gap="sm" className="flex-1">
      {isExecuting ? (
        <Button
          variant="danger"
          size="sm"
          onClick={onCancel}
          className="flex items-center gap-1.5 bg-error/10 text-error hover:bg-error/20 border-0"
        >
          <Square size={12} /> Cancel
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onExecute}
          className="flex items-center gap-1.5 bg-success/10 text-success hover:bg-success/20 border-0"
        >
          <Play size={12} /> Run
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onExplain}
        disabled={isExecuting}
        className="flex items-center gap-1.5"
      >
        <FileSearch size={12} /> Explain
      </Button>

      <Spacer />

      <Flex direction="row" align="center" gap="md" className="text-xs">
        {isExecuting && (
          <Flex direction="row" align="center" gap="xs">
            <Spinner size="xs" />
            <Text size="xs" color="muted">Executing...</Text>
          </Flex>
        )}
        {!isExecuting && duration !== null && (
          <Text size="xs" color="success">{rowCount} rows · {duration}ms</Text>
        )}
        {!isExecuting && error && (
          <Text size="xs" color="error" truncate className="max-w-xs" title={error}>{error}</Text>
        )}
      </Flex>
    </Flex>
  )
}
