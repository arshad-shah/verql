import { Card, Badge, EmptyState } from '@/primitives'
import { Stack } from '@arshad-shah/cynosure-react/stack'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Box } from '@arshad-shah/cynosure-react/box'
import { Switch } from '@arshad-shah/cynosure-react/switch'
import { VisuallyHidden } from '@arshad-shah/cynosure-react'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Alert, AlertDescription } from '@arshad-shah/cynosure-react/alert'
import { useTranslation } from '@/i18n/I18nProvider'
import type { PermissionState } from './types'

export function PermissionsTab({ permissions, onToggle }: {
  permissions: PermissionState | null
  onToggle: (permission: string, granted: boolean) => void
}) {
  const { t } = useTranslation()
  if (!permissions) {
    return <EmptyState title={t('plugins.detail.permissions.loadingTitle')} description={t('plugins.detail.permissions.loadingDescription')} className="py-12" />
  }

  if (permissions.trusted) {
    return (
      <Stack gap="3">
        <Alert status="info">
          <AlertDescription>{t('plugins.detail.permissions.trusted')}</AlertDescription>
        </Alert>
      </Stack>
    )
  }

  if (permissions.declared.length === 0) {
    return (
      <EmptyState
        title={t('plugins.detail.permissions.noneTitle')}
        description={t('plugins.detail.permissions.noneDescription')}
        className="py-12"
      />
    )
  }

  return (
    <Stack gap="3">
      <Alert status="warning">
        <AlertDescription>{t('plugins.detail.permissions.warning')}</AlertDescription>
      </Alert>
      <Card padding="md">
        <Stack gap="3">
          {permissions.declared.map((perm) => {
            const info = permissions.info[perm]
            const granted = permissions.granted.includes(perm)
            return (
              <Flex key={perm} direction="row" align="start" justify="between" gap="3">
                <Box className="flex-1 min-w-0">
                  <Flex direction="row" align="center" gap="2" className="flex-wrap">
                    <Text size="sm" weight="medium">{info?.title ?? perm}</Text>
                    <Badge size="sm" variant={info?.enforced ? 'accent' : 'default'}>
                      {info?.enforced ? t('plugins.detail.permissions.enforced') : t('plugins.detail.permissions.advisory')}
                    </Badge>
                  </Flex>
                  <Text size="xs" color="fg.subtle" as="p" className="mt-1 leading-relaxed">
                    {info?.description ?? t('plugins.detail.permissions.capabilityFallback', { perm })}
                    {info && !info.enforced && (
                      <>{t('plugins.detail.permissions.advisoryNote')}</>
                    )}
                  </Text>
                </Box>
                <Box className="shrink-0">
                  <Switch
                    checked={granted}
                    onCheckedChange={(checked) => onToggle(perm, checked)}
                  >
                    <VisuallyHidden>{info?.title ?? perm}</VisuallyHidden>
                  </Switch>
                </Box>
              </Flex>
            )
          })}
        </Stack>
      </Card>
    </Stack>
  )
}
