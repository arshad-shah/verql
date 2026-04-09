import { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry, type ColDef, themeQuartz } from 'ag-grid-community'
import type { QueryResult } from '@shared/types'
import { useSettingsStore } from '@/stores/settings'
import { Box } from '@/primitives'

ModuleRegistry.registerModules([AllCommunityModule])

const darkTheme = themeQuartz.withParams({
  backgroundColor: '#1a1a2e',
  foregroundColor: '#ffffff',
  headerBackgroundColor: '#12121f',
  headerForegroundColor: '#888888',
  borderColor: '#2a2a3e',
  rowHoverColor: 'rgba(124, 111, 247, 0.05)',
  selectedRowBackgroundColor: 'rgba(124, 111, 247, 0.1)',
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  fontSize: 12,
  headerFontSize: 11,
  headerFontWeight: 600,
  cellHorizontalPadding: 10,
  oddRowBackgroundColor: 'rgba(255, 255, 255, 0.01)',
})

interface Props {
  results: QueryResult
}

export function ResultsGrid({ results }: Props) {
  const dataDisplay = useSettingsStore(s => s.settings.dataDisplay)
  const defaultPageSize = useSettingsStore(s => s.settings.general.defaultPageSize)

  const columnDefs = useMemo<ColDef[]>(() => {
    return results.fields.map((field) => ({
      field: field.name,
      headerName: field.name,
      resizable: true,
      sortable: true,
      filter: true,
      minWidth: 80,
      maxWidth: dataDisplay.maxColumnWidth,
      cellStyle: (params: any) => {
        if (params.value === null || params.value === undefined) {
          return { color: '#666', fontStyle: 'italic' }
        }
        if (typeof params.value === 'number') {
          return { color: '#e5c07b' }
        }
        return null
      },
      valueFormatter: (params: any) => {
        if (params.value === null || params.value === undefined) return dataDisplay.nullDisplay
        if (params.value instanceof Date || (typeof params.value === 'string' && !isNaN(Date.parse(params.value)) && /^\d{4}-\d{2}/.test(params.value))) {
          const date = params.value instanceof Date ? params.value : new Date(params.value)
          if (!isNaN(date.getTime())) {
            if (dataDisplay.dateFormat === 'locale') return date.toLocaleString()
            return date.toISOString()
          }
        }
        if (typeof params.value === 'number') {
          if (dataDisplay.numberFormat === 'locale') return params.value.toLocaleString()
          return String(params.value)
        }
        if (typeof params.value === 'object') return JSON.stringify(params.value)
        return String(params.value)
      }
    }))
  }, [results.fields, dataDisplay])

  return (
    <Box className="flex-1 overflow-hidden">
      <AgGridReact
        theme={darkTheme}
        rowData={results.rows}
        columnDefs={columnDefs}
        defaultColDef={{
          resizable: true,
          sortable: true,
          filter: true
        }}
        enableCellTextSelection={true}
        suppressRowClickSelection={true}
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
