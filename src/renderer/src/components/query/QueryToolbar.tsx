import { useEffect } from 'react'
import { Play, Square, FileSearch } from 'lucide-react'
import { Flex, Spacer } from '@/primitives'
import { Spinner } from '@arshad-shah/cynosure-react/spinner'
import { Button } from '@arshad-shah/cynosure-react/button'
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
          variant="soft"
          colorScheme="danger"
          size="sm"
          onClick={onCancel}
          leftIcon={<span className="flex items-center gap-1.5"><Spinner size="xs" colorScheme="currentColor" /><Square size={12} /></span>}
        >
          {t('query.toolbar.cancel')}
        </Button>
      ) : (
        <Button
          variant="soft"
          colorScheme="success"
          size="sm"
          onClick={onExecute}
          leftIcon={<Play size={12} />}
        >
          {t('query.toolbar.run')}
        </Button>
      )}

      {canExplain && (
        <Button
          variant="outline"
          colorScheme="neutral"
          size="sm"
          onClick={onExplain}
          disabled={isExecuting}
          leftIcon={<FileSearch size={12} />}
        >
          {t('query.toolbar.explain')}
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
