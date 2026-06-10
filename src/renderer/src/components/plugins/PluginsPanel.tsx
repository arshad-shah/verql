import { useEffect, useState } from 'react'
import { FolderOpen, RefreshCw, Package } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { useTranslation } from '@/i18n/I18nProvider'
import { cn } from '@/primitives'
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@arshad-shah/cynosure-react/empty-state'
import { Stack } from '@arshad-shah/cynosure-react/stack'
import { ScrollArea } from '@arshad-shah/cynosure-react/scroll-area'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Box } from '@arshad-shah/cynosure-react/box'
import { SearchInput } from '@arshad-shah/cynosure-react/search-input'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Spinner } from '@arshad-shah/cynosure-react/spinner'
import { IconButton } from '@arshad-shah/cynosure-react/icon-button'
import { IPC_CHANNELS } from '@shared/ipc'
import { PluginIcon } from './PluginIcon'

export interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  bundled: boolean
  icon?: string
  status: { state: string; error?: string; phase?: string; contributions?: string[] }
  contributions: string[]
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-400',
  degraded: 'bg-yellow-400',
  error: 'bg-red-400',
}

export function PluginsPanel() {
  const { t } = useTranslation()
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const openPluginDetail = useTabsStore(s => s.openPluginDetail)
  const openInstallPlugin = useTabsStore(s => s.openInstallPlugin)
  const activeTabId = useTabsStore(s => s.activeTabId)
  const loadPlugins = async () => {
    setLoading(true)
    const list = await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_LIST)
    setPlugins(list)
    setLoading(false)
  }

  useEffect(() => { loadPlugins() }, [])

  if (loading) {
    return (
      <Flex align="center" justify="center" className="py-8">
        <Spinner size="sm" />
      </Flex>
    )
  }

  const filtered = plugins.filter(p =>
    p.displayName.toLowerCase().includes(search.toLowerCase())
  )
  const bundledPlugins = filtered.filter(p => p.bundled)
  const installedPlugins = filtered.filter(p => !p.bundled)

  return (
    <Stack className="h-full">
      <Flex direction="row" align="center" gap="1" className="px-2 py-1.5">
        <SearchInput
          size="sm"
          placeholder={t('plugins.list.searchPlaceholder')}
          value={search}
          onChange={setSearch}
          className="flex-1"
        />
        <IconButton
          label={t('plugins.list.installFromFolder')}
          size="xs"
          variant="ghost"
          colorScheme="neutral"
          onClick={openInstallPlugin}
          className="shrink-0"
          icon={<FolderOpen size={12} />}
        />
        <IconButton
          label={t('plugins.list.refresh')}
          size="xs"
          variant="ghost"
          colorScheme="neutral"
          onClick={loadPlugins}
          className="shrink-0"
          icon={<RefreshCw size={11} />}
        />
      </Flex>

      <ScrollArea scrollbars="vertical" className="flex-1 px-1">
        {filtered.length === 0 && (
          <EmptyState variant="subtle" className="py-8">
            <EmptyStateIcon>
              <Package size={24} className="text-text-muted" />
            </EmptyStateIcon>
            <EmptyStateTitle>
              {search ? t('plugins.list.noMatches') : t('plugins.list.empty')}
            </EmptyStateTitle>
          </EmptyState>
        )}

        {bundledPlugins.length > 0 && (
          <>
            <Box className="px-2 pt-2 pb-1">
              <Text size="xs" color="fg.subtle" weight="medium" className="text-[10px] uppercase tracking-wide">{t('plugins.list.builtIn')}</Text>
            </Box>
            {bundledPlugins.map(plugin => (
              <PluginRow
                key={plugin.name}
                plugin={plugin}
                isSelected={activeTabId === `plugin-${plugin.name}`}
                onClick={() => openPluginDetail(plugin.name, plugin.displayName)}
              />
            ))}
          </>
        )}

        {installedPlugins.length > 0 && (
          <>
            <Box className="px-2 pt-3 pb-1">
              <Text size="xs" color="fg.subtle" weight="medium" className="text-[10px] uppercase tracking-wide">{t('plugins.list.installed')}</Text>
            </Box>
            {installedPlugins.map(plugin => (
              <PluginRow
                key={plugin.name}
                plugin={plugin}
                isSelected={activeTabId === `plugin-${plugin.name}`}
                onClick={() => openPluginDetail(plugin.name, plugin.displayName)}
              />
            ))}
          </>
        )}

        {filtered.length > 0 && (
          <Text size="xs" color="fg.subtle" align="center" className="text-[10px] py-3 block">
            {t('plugins.list.count', { count: plugins.length })}
          </Text>
        )}
      </ScrollArea>

    </Stack>
  )
}

function PluginRow({ plugin, isSelected, onClick }: { plugin: PluginInfo; isSelected: boolean; onClick: () => void }) {
  const statusColor = STATUS_COLORS[plugin.status.state] ?? 'bg-gray-500'

  return (
    <Flex
      direction="row"
      align="center"
      gap="2"
      onClick={onClick}
      className={cn(
        'px-2 py-1.5 rounded-md cursor-pointer transition-colors',
        isSelected
          ? 'bg-accent/10 border-l-2 border-l-accent'
          : 'hover:bg-white/5'
      )}
    >
      <PluginIcon plugin={plugin} size={28} />
      <Text size="xs" weight="medium" truncate className="flex-1 min-w-0">
        {plugin.displayName}
      </Text>
      <Box className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
    </Flex>
  )
}
