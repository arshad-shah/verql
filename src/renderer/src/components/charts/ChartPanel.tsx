import { useState, useMemo } from 'react'
import { ChartView } from './ChartView'
import { detectChartType, suggestAxes, type ChartType } from './chart-detect'
import type { QueryResult } from '@shared/types'
import { Flex, Box, Button, Text, Label, Select } from '@/primitives'

interface Props {
  results: QueryResult
}

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'pie', label: 'Pie' },
  { value: 'scatter', label: 'Scatter' }
]

export function ChartPanel({ results }: Props) {
  const detected = useMemo(() => detectChartType(results.fields, results.rows), [results])
  const suggestedAxes = useMemo(() => suggestAxes(results.fields, results.rows), [results])

  const [chartType, setChartType] = useState<ChartType>(detected)
  const [xKey, setXKey] = useState(suggestedAxes?.x ?? results.fields[0]?.name ?? '')
  const [yKey, setYKey] = useState(suggestedAxes?.y ?? results.fields[1]?.name ?? '')

  if (results.fields.length < 2) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Text size="sm" color="muted">Need at least 2 columns to chart</Text>
      </Flex>
    )
  }

  return (
    <Flex direction="column" className="h-full">
      <Flex align="center" gap="md" className="px-3 py-2 border-b border-border bg-bg-secondary shrink-0">
        <Flex gap="xs">
          {CHART_TYPES.map(ct => (
            <Button
              key={ct.value}
              variant={chartType === ct.value ? 'solid' : 'outline'}
              size="xs"
              onClick={() => setChartType(ct.value)}
            >
              {ct.label}
            </Button>
          ))}
        </Flex>
        <Flex align="center" gap="sm" className="text-xs ml-auto">
          <Label className="text-text-muted">X:</Label>
          <Select
            value={xKey}
            onChange={setXKey}
            size="xs"
            options={results.fields.map(f => ({ value: f.name, label: f.name }))}
            aria-label="X axis"
          />
          <Label className="text-text-muted">Y:</Label>
          <Select
            value={yKey}
            onChange={setYKey}
            size="xs"
            options={results.fields.map(f => ({ value: f.name, label: f.name }))}
            aria-label="Y axis"
          />
        </Flex>
      </Flex>
      <Box padding="lg" className="flex-1">
        <ChartView type={chartType} data={results.rows} xKey={xKey} yKey={yKey} />
      </Box>
    </Flex>
  )
}
