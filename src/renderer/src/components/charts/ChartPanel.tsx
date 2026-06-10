import { useState, useMemo } from 'react'
import { ChartView } from './ChartView'
import { detectChartType, suggestAxes, type ChartType } from './chart-detect'
import type { QueryResult } from '@shared/types'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Box } from '@arshad-shah/cynosure-react/box'
import { Select } from '@arshad-shah/cynosure-react/select'
import { Label } from '@arshad-shah/cynosure-react/label'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Button } from '@arshad-shah/cynosure-react/button'
import { useTranslation } from '@/i18n/I18nProvider'
import type { MessageKey } from '@shared/i18n'

interface Props {
  results: QueryResult
}

const CHART_TYPES: { value: ChartType; label: MessageKey }[] = [
  { value: 'bar', label: 'shell.chartPanel.typeBar' },
  { value: 'line', label: 'shell.chartPanel.typeLine' },
  { value: 'pie', label: 'shell.chartPanel.typePie' },
  { value: 'scatter', label: 'shell.chartPanel.typeScatter' }
]

export function ChartPanel({ results }: Props) {
  const { t } = useTranslation()
  const detected = useMemo(() => detectChartType(results.fields, results.rows), [results])
  const suggestedAxes = useMemo(() => suggestAxes(results.fields, results.rows), [results])

  const [chartType, setChartType] = useState<ChartType>(detected)
  const [xKey, setXKey] = useState(suggestedAxes?.x ?? results.fields[0]?.name ?? '')
  const [yKey, setYKey] = useState(suggestedAxes?.y ?? results.fields[1]?.name ?? '')

  if (results.fields.length < 2) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Text size="sm" color="fg.subtle">{t('shell.chartPanel.needTwoColumns')}</Text>
      </Flex>
    )
  }

  return (
    <Flex direction="column" className="h-full">
      <Flex align="center" gap="3" className="px-3 py-2 border-b border-border bg-bg-secondary shrink-0">
        <Flex gap="1">
          {CHART_TYPES.map(ct => (
            <Button
              key={ct.value}
              variant={chartType === ct.value ? 'solid' : 'outline'}
              colorScheme={chartType === ct.value ? 'accent' : 'neutral'}
              size="xs"
              onClick={() => setChartType(ct.value)}
            >
              {t(ct.label)}
            </Button>
          ))}
        </Flex>
        <Flex align="center" gap="2" className="text-xs ml-auto">
          <Label>{t('shell.chartPanel.xAxisLabel')}</Label>
          <Select
            value={xKey}
            onValueChange={setXKey}
            size="sm"
            items={results.fields.map(f => ({ value: f.name, label: f.name }))}
            aria-label={t('shell.chartPanel.xAxis')}
          />
          <Label>{t('shell.chartPanel.yAxisLabel')}</Label>
          <Select
            value={yKey}
            onValueChange={setYKey}
            size="sm"
            items={results.fields.map(f => ({ value: f.name, label: f.name }))}
            aria-label={t('shell.chartPanel.yAxis')}
          />
        </Flex>
      </Flex>
      <Box padding="4" className="flex-1">
        <ChartView type={chartType} data={results.rows} xKey={xKey} yKey={yKey} />
      </Box>
    </Flex>
  )
}
