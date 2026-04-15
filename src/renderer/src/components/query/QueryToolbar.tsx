import { useEffect } from 'react'
import { Play, Square, FileSearch } from 'lucide-react'
import { Flex, Button, Spinner, Spacer } from '@/primitives'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { WidgetRenderer } from '@/components/plugin-ui/WidgetRenderer'

interface Props {
  onExecute: () => void
  onCancel: () => void
  onExplain: () => void
  isExecuting: boolean
  connectionType?: string
}

export function QueryToolbar({ onExecute, onCancel, onExplain, isExecuting, connectionType }: Props) {
  const toolbarContributions = usePluginUIStore(selectContributions('toolbar'))

  useEffect(() => {
    usePluginUIStore.getState().fetchContributions('toolbar')
  }, [])

  return (
    <Flex direction="row" align="center" gap="sm" className="flex-1">
      {isExecuting ? (
        <Button
          variant="danger"
          size="sm"
          onClick={onCancel}
          className="flex items-center gap-1.5 bg-error/10 text-error hover:bg-error/20 border-0"
        >
          <Spinner size="xs" />
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

      {/* Plugin-contributed toolbar widgets (e.g. Snowflake Role/Warehouse selectors) */}
      {connectionType && toolbarContributions
        .filter((c) => c.pluginId.includes(connectionType))
        .map((c) => (
          <WidgetRenderer key={c.contributionId} widgets={c.widgets} pluginId={c.pluginId} />
        ))}
    </Flex>
  )
}
