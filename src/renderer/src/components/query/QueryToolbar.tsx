import { useEffect } from 'react'
import { Play, Square, FileSearch } from 'lucide-react'
import { Flex, Button, Spinner, Spacer } from '@/primitives'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { WidgetRenderer } from '@/components/plugin-ui/WidgetRenderer'
import { useTranslation } from '@/i18n/I18nProvider'

interface Props {
  onExecute: () => void
  onCancel: () => void
  onExplain: () => void
  isExecuting: boolean
  connectionType?: string
  /** Whether the active driver declares an explain capability. When false the
   *  Explain action is hidden (e.g. Redis/MongoDB have no EXPLAIN). */
  canExplain?: boolean
}

export function QueryToolbar({ onExecute, onCancel, onExplain, isExecuting, connectionType, canExplain }: Props) {
  const { t } = useTranslation()
  const toolbarContributions = usePluginUIStore(selectContributions('toolbar'))

  useEffect(() => {
    usePluginUIStore.getState().fetchContributions('toolbar')
  }, [])

  return (
    <Flex direction="row" align="center" gap="sm" className="flex-1">
      {isExecuting ? (
        <Button
          variant="error"
          size="sm"
          onClick={onCancel}
          className="flex items-center gap-1.5 bg-error/10 text-error hover:bg-error/20 border-0"
        >
          <Spinner size="xs" />
          <Square size={12} /> {t('query.toolbar.cancel')}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onExecute}
          className="flex items-center gap-1.5 bg-success/10 text-success hover:bg-success/20 border-0"
        >
          <Play size={12} /> {t('query.toolbar.run')}
        </Button>
      )}

      {canExplain && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExplain}
          disabled={isExecuting}
          className="flex items-center gap-1.5"
        >
          <FileSearch size={12} /> {t('query.toolbar.explain')}
        </Button>
      )}

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
