import { XCircle } from 'lucide-react'
import {
  EmptyState,
  EmptyStateTitle,
  EmptyStateDescription,
} from '@arshad-shah/cynosure-react/empty-state'
import { Card, CardBody } from '@arshad-shah/cynosure-react/card'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Box } from '@arshad-shah/cynosure-react/box'
import { Stack } from '@arshad-shah/cynosure-react/stack'
import { Code } from '@arshad-shah/cynosure-react/code'
import { Text } from '@arshad-shah/cynosure-react/text'
import { useTranslation } from '@/i18n/I18nProvider'
import type { ErrorRecord } from './types'

export function ErrorsTab({ errors, expandedError, onToggleError }: {
  errors: ErrorRecord[]
  expandedError: number | null
  onToggleError: (i: number | null) => void
}) {
  const { t } = useTranslation()
  if (errors.length === 0) {
    return (
      <EmptyState variant="subtle" className="py-12">
        <EmptyStateTitle>{t('plugins.detail.errors.emptyTitle')}</EmptyStateTitle>
        <EmptyStateDescription>{t('plugins.detail.errors.emptyDescription')}</EmptyStateDescription>
      </EmptyState>
    )
  }

  return (
    <Card size="sm">
      <CardBody>
      <Stack gap="1">
        {errors.slice(-20).reverse().map((err, i) => (
          <Box key={i}>
            <Flex
              direction="row"
              align="start"
              gap="2"
              onClick={() => onToggleError(expandedError === i ? null : i)}
              className="py-1.5 cursor-pointer hover:bg-white/5 rounded px-2 -mx-2 transition-colors"
            >
              <XCircle size={14} className="text-error mt-0.5 shrink-0" />
              <Box className="flex-1 min-w-0">
                <Text size="xs" color="fg.muted" truncate className="block">{err.error}</Text>
                <Text size="xs" color="fg.subtle" className="text-[10px]">{new Date(err.timestamp).toLocaleString()}</Text>
              </Box>
            </Flex>
            {expandedError === i && err.stack && (
              <Code variant="block" size="sm" className="text-[11px] text-text-muted mt-1 overflow-x-auto whitespace-pre-wrap">
                {err.stack}
              </Code>
            )}
          </Box>
        ))}
      </Stack>
      </CardBody>
    </Card>
  )
}
