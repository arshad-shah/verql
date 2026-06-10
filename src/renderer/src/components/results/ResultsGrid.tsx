import { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry, type ColDef, themeQuartz } from 'ag-grid-community'
import type { QueryResult } from '@shared/types'
import { useSelectionStore } from '@/stores/selection'
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/primitives/theme/ThemeProvider'
import { Box } from '@arshad-shah/cynosure-react/box'
import type { DataDisplaySettings } from '@shared/settings'
import { formatBoolean, formatWithPattern, truncateText } from '@/lib/format-cell'

/** Render a raw cell value to its full (untruncated) display string,
 *  honouring the user's data-display preferences. */
function formatCellValue(value: unknown, dd: DataDisplaySettings): string {
  if (value === null || value === undefined) return dd.nullDisplay
  if (typeof value === 'boolean') return formatBoolean(value, dd.booleanDisplay)
  if (
    value instanceof Date ||
    (typeof value === 'string' && !isNaN(Date.parse(value)) && /^\d{4}-\d{2}/.test(value))
  ) {
    const date = value instanceof Date ? value : new Date(value as string)
    if (!isNaN(date.getTime())) {
      if (dd.dateFormat === 'locale') return date.toLocaleString()
      if (dd.dateFormat === 'custom') return formatWithPattern(date, dd.customDateFormat)
      return date.toISOString()
    }
  }
  if (typeof value === 'number') {
    if (dd.numberFormat === 'locale') return value.toLocaleString()
    return String(value)
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

ModuleRegistry.registerModules([AllCommunityModule])

function useGridTheme() {
  const { theme } = useTheme()
  const editorFontFamily = useSettingsStore(s => s.settings.editor.fontFamily)
  const editorFontSize = useSettingsStore(s => s.settings.editor.fontSize)
  return useMemo(() => {
    const style = getComputedStyle(document.documentElement)
    const get = (v: string) => style.getPropertyValue(v).trim()

    return themeQuartz.withParams({
      backgroundColor: get('--color-bg-secondary'),
      foregroundColor: get('--color-text-primary'),
      headerBackgroundColor: get('--color-bg-primary'),
      headerTextColor: get('--color-text-secondary'),
      borderColor: get('--color-border-default'),
      rowHoverColor: get('--color-hover'),
      selectedRowBackgroundColor: get('--color-active'),
      fontFamily: editorFontFamily,
      fontSize: Math.max(11, editorFontSize - 2),
      headerFontSize: Math.max(10, editorFontSize - 3),
      headerFontWeight: 600,
      cellHorizontalPadding: 10,
      oddRowBackgroundColor: get('--color-bg-primary'),
    })
  }, [theme, editorFontFamily, editorFontSize])
}

interface Props {
  results: QueryResult
  tabId?: string
}

export function ResultsGrid({ results, tabId }: Props) {
  const gridTheme = useGridTheme()
  const dataDisplay = useSettingsStore(s => s.settings.dataDisplay)
  const defaultPageSize = useSettingsStore(s => s.settings.general.defaultPageSize)

  const columnDefs = useMemo<ColDef[]>(() => {
    return results.fields.map((field): ColDef => ({
      field: field.name,
      headerName: field.name,
      resizable: true,
      sortable: true,
      filter: true,
      minWidth: 80,
      maxWidth: dataDisplay.maxColumnWidth,
      cellStyle: ((params: { value: unknown }) => {
        if (params.value === null || params.value === undefined) {
          return { color: 'var(--color-text-disabled)', fontStyle: 'italic' }
        }
        if (typeof params.value === 'number') {
          return { color: 'var(--color-warning)' }
        }
        return undefined
      }) as ColDef['cellStyle'],
      valueFormatter: (params: any) =>
        truncateText(formatCellValue(params.value, dataDisplay), dataDisplay.truncateTextAt),
      // Surface the full value in a tooltip only when the cell was truncated,
      // so we don't pop a redundant tooltip on every short cell.
      tooltipValueGetter: (params: any) => {
        const full = formatCellValue(params.value, dataDisplay)
        return dataDisplay.truncateTextAt > 0 && full.length > dataDisplay.truncateTextAt
          ? full
          : null
      },
    }))
  }, [results.fields, dataDisplay])

  return (
    <Box className="h-full w-full overflow-hidden">
      <AgGridReact
        theme={gridTheme}
        rowData={results.rows}
        columnDefs={columnDefs}
        defaultColDef={{
          resizable: true,
          sortable: true,
          filter: true
        }}
        enableCellTextSelection={true}
        suppressRowClickSelection={true}
        onRowClicked={(e) => {
          if (!tabId || !e.data) return
          const columns = results.fields.map((f) => ({
            name: f.name,
            dataType: f.dataType,
          }))
          useSelectionStore.getState().setSelection({
            kind: 'row',
            tabId,
            row: e.data as Record<string, unknown>,
            columns,
          })
        }}
        animateRows={false}
        rowHeight={28}
        headerHeight={32}
        pagination={true}
        paginationPageSize={defaultPageSize}
        paginationPageSizeSelector={[50, 100, 500, 1000]}
      />
    </Box>
  )
}
