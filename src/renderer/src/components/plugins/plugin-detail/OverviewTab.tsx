import { Card, CardBody } from '@arshad-shah/cynosure-react/card'
import { Stack } from '@arshad-shah/cynosure-react/stack'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Alert, AlertDescription } from '@arshad-shah/cynosure-react/alert'
import { useTranslation } from '@/i18n/I18nProvider'
import type { StateConfig } from './constants'
import type { PluginInfo, ErrorRecord } from './types'

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Flex direction="row" align="center" justify="between">
      <Text size="xs" color="fg.subtle">{label}</Text>
      <Text size="xs" color="fg.muted" className={mono ? 'font-mono' : ''}>{value}</Text>
    </Flex>
  )
}

export function OverviewTab({ plugin, stateConfig, errors }: {
  plugin: PluginInfo
  stateConfig: StateConfig
  errors: ErrorRecord[]
}) {
  const { t } = useTranslation()
  const StateIcon = stateConfig.icon
  return (
    <Stack gap="4">
      {/* Stat Cards */}
      <Flex direction="row" gap="3">
        <Card size="sm" className="flex-1">
          <CardBody>
            <Text size="xs" color="fg.subtle" weight="medium" className="text-[10px] uppercase tracking-wide mb-2 block">{t('plugins.detail.overview.statusLabel')}</Text>
            <Flex direction="row" align="center" gap="1">
              <StateIcon size={16} />
              <Text size="sm" weight="medium">{t(stateConfig.labelKey)}</Text>
            </Flex>
          </CardBody>
        </Card>
        <Card size="sm" className="flex-1">
          <CardBody>
            <Text size="xs" color="fg.subtle" weight="medium" className="text-[10px] uppercase tracking-wide mb-2 block">{t('plugins.detail.overview.contributionsLabel')}</Text>
            <Text size="sm" weight="medium">{t('plugins.detail.overview.contributionsValue', { count: plugin.contributions.length })}</Text>
          </CardBody>
        </Card>
        <Card size="sm" className="flex-1">
          <CardBody>
            <Text size="xs" color="fg.subtle" weight="medium" className="text-[10px] uppercase tracking-wide mb-2 block">{t('plugins.detail.overview.errorsLabel')}</Text>
            <Text size="sm" weight="medium">{errors.length > 0 ? t('plugins.detail.overview.errorsValue', { count: errors.length }) : t('plugins.detail.overview.errorsNone')}</Text>
          </CardBody>
        </Card>
      </Flex>

      {/* Error alert if present */}
      {plugin.status.error && (
        <Alert status="danger"><AlertDescription>{plugin.status.error}</AlertDescription></Alert>
      )}

      {/* Details Card */}
      <Card size="sm">
        <CardBody>
          <Text size="xs" color="fg.subtle" weight="medium" className="text-[10px] uppercase tracking-wide mb-3 block">{t('plugins.detail.overview.detailsLabel')}</Text>
          <Stack gap="2">
            <DetailRow label={t('plugins.detail.overview.identifier')} value={plugin.name} mono />
            <DetailRow label={t('plugins.detail.overview.version')} value={plugin.version} />
            <DetailRow label={t('plugins.detail.overview.source')} value={plugin.bundled ? t('plugins.detail.overview.sourceBuiltIn') : t('plugins.detail.overview.sourceUserInstalled')} />
            {plugin.status.phase && plugin.status.state === 'error' && (
              <DetailRow label={t('plugins.detail.overview.failedDuring')} value={plugin.status.phase} />
            )}
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  )
}
