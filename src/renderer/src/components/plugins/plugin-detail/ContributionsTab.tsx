import { Badge } from '@arshad-shah/cynosure-react/badge'
import {
  EmptyState,
  EmptyStateTitle,
  EmptyStateDescription,
} from '@arshad-shah/cynosure-react/empty-state'
import { Card, CardBody } from '@arshad-shah/cynosure-react/card'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Stack } from '@arshad-shah/cynosure-react/stack'
import { Text } from '@arshad-shah/cynosure-react/text'
import { useTranslation } from '@/i18n/I18nProvider'
import { CONTRIBUTION_BADGE_VARIANTS } from './constants'

export function ContributionsTab({ contributions }: { contributions: string[] }) {
  const { t } = useTranslation()
  if (contributions.length === 0) {
    return (
      <EmptyState variant="subtle" className="py-12">
        <EmptyStateTitle>{t('plugins.detail.contributions.emptyTitle')}</EmptyStateTitle>
        <EmptyStateDescription>{t('plugins.detail.contributions.emptyDescription')}</EmptyStateDescription>
      </EmptyState>
    )
  }

  return (
    <Card size="sm">
      <CardBody>
      <Stack gap="1">
        {contributions.map((c, i) => {
          const [type, name] = c.includes(':') ? c.split(':') : ['feature', c]
          const colorScheme = CONTRIBUTION_BADGE_VARIANTS[type] ?? 'neutral'
          return (
            <Flex key={i} direction="row" align="center" gap="2" className="py-1">
              <Badge size="sm" shape="pill" colorScheme={colorScheme} className="w-20 text-center justify-center shrink-0">{type}</Badge>
              <Text size="sm" color="fg.muted">{name}</Text>
            </Flex>
          )
        })}
      </Stack>
      </CardBody>
    </Card>
  )
}
