import { useEffect, useMemo } from 'react'
import { Line, Bar, Pie, Scatter } from '@arshad-shah/swift-chart/react'
import { addTheme } from '@arshad-shah/swift-chart'
import type { ChartType } from './chart-detect'
import { Flex, Text } from '@/primitives'
import { useTheme } from '@/primitives/theme/ThemeProvider'

const THEME_NAME = 'verql'

function readVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function registerVerqlTheme(): void {
  addTheme(THEME_NAME, {
    bg: readVar('--color-bg-primary', '#0b0f16'),
    surface: readVar('--color-bg-secondary', '#131825'),
    grid: readVar('--color-border-subtle', 'rgba(255,255,255,0.06)'),
    text: readVar('--color-text-primary', '#e8ecf3'),
    textMuted: readVar('--color-text-tertiary', '#8a93a4'),
    axis: readVar('--color-border-default', 'rgba(255,255,255,0.1)'),
    positive: readVar('--color-success', '#2bd9a3'),
    negative: readVar('--color-error', '#ff5f57'),
    onAccent: readVar('--color-text-inverse', '#0b0f16'),
    colors: [
      readVar('--color-accent', '#7c6ff7'),
      readVar('--color-accent-emphasis', '#5b8cff'),
      readVar('--color-success', '#2bd9a3'),
      readVar('--color-warning', '#e5c07b'),
      readVar('--color-error', '#ff5f57'),
      readVar('--color-accent-hover', '#a89bff'),
    ],
    tooltipBg: readVar('--color-bg-elevated', '#1a1f2e'),
    tooltipBorder: readVar('--color-border-strong', 'rgba(255,255,255,0.16)'),
    tooltipText: readVar('--color-text-primary', '#e8ecf3'),
  })
}

interface Props {
  type: ChartType
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
}

export function ChartView({ type, data, xKey, yKey }: Props) {
  const { theme } = useTheme()

  // Re-register the palette whenever the active theme id changes so
  // swift-chart's bake step picks up new CSS variable values.
  useEffect(() => {
    registerVerqlTheme()
  }, [theme])

  const common = useMemo(
    () => ({ data, theme: THEME_NAME, height: '100%' as const }),
    [data],
  )

  if (type === 'none' || data.length === 0) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Text size="sm" color="muted">No chart available</Text>
      </Flex>
    )
  }

  switch (type) {
    case 'bar':
      return <Bar {...common} mapping={{ x: xKey, y: yKey }} />
    case 'line':
      return <Line {...common} mapping={{ x: xKey, y: yKey }} />
    case 'pie':
      return <Pie {...common} mapping={{ labelField: xKey, valueField: yKey }} />
    case 'scatter':
      return <Scatter {...common} mapping={{ x: xKey, y: yKey }} />
    default:
      return null
  }
}
