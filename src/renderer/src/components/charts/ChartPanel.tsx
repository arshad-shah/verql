import { useState, useMemo } from 'react'
import { ChartView } from './ChartView'
import { detectChartType, suggestAxes, type ChartType } from './chart-detect'
import type { QueryResult } from '@shared/types'

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
    return <div className="flex items-center justify-center h-full text-text-muted text-sm">Need at least 2 columns to chart</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-bg-secondary shrink-0">
        <div className="flex gap-1">
          {CHART_TYPES.map(ct => (
            <button
              key={ct.value}
              onClick={() => setChartType(ct.value)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${chartType === ct.value ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary border border-border'}`}
            >
              {ct.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs ml-auto">
          <label className="text-text-muted">X:</label>
          <select value={xKey} onChange={e => setXKey(e.target.value)} className="bg-bg-tertiary border border-border rounded px-2 py-0.5 text-xs text-text-primary">
            {results.fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
          <label className="text-text-muted">Y:</label>
          <select value={yKey} onChange={e => setYKey(e.target.value)} className="bg-bg-tertiary border border-border rounded px-2 py-0.5 text-xs text-text-primary">
            {results.fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex-1 p-4">
        <ChartView type={chartType} data={results.rows} xKey={xKey} yKey={yKey} />
      </div>
    </div>
  )
}
