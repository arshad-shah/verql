import { useEffect, useState } from 'react'
import { FolderOpen, RefreshCw, Package } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { useTranslation } from '@/i18n/I18nProvider'
import { Stack, ScrollArea, Flex, EmptyState, Box, SearchInput, cn } from '@/primitives'
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
      <Flex direction="row" align="center" gap="xs" className="px-2 py-1.5">
        <SearchInput
          size="xs"
          placeholder={t('plugins.list.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch('')}
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

      <ScrollArea direction="vertical" className="flex-1 px-1">
        {filtered.length === 0 && (
          <EmptyState
            icon={<Package size={24} className="text-text-muted" />}
            title={search ? t('plugins.list.noMatches') : t('plugins.list.empty')}
            className="py-8"
          />
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
      gap="sm"
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
