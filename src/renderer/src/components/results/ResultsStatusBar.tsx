import { useState, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import type { QueryResult } from '@shared/types'
import { Flex, Text, Button } from '@/primitives'

interface Props {
  results: QueryResult
  /** Plugin-contributed action buttons (e.g. AI Explain). Rendered inline. */
  actions?: ReactNode
}

export function ResultsStatusBar({ results, actions }: Props) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true)
    try {
      const fields = results.fields.map(f => f.name)
      await window.electronAPI.invoke('export:query-result', results.rows, fields, format)
    } catch {
      // ignore — user may have cancelled
    }
    setExporting(false)
  }

  return (
    <Flex
      direction="row"
      align="center"
      justify="between"
      gap="md"
      className="px-3 py-1 border-t border-border bg-bg-secondary text-xs shrink-0"
    >
      <Flex direction="row" align="center" gap="md" className="min-w-0">
        <Text size="xs" color="success">
          {results.rowCount} {results.rowCount === 1 ? 'row' : 'rows'}
        </Text>
        <Text size="xs" color="muted">·</Text>
        <Text size="xs" color="secondary">{results.duration}ms</Text>
        <Text size="xs" color="muted">·</Text>
        <Text size="xs" color="muted">{results.fields.length} cols</Text>
        {results.affectedRows > 0 && (
          <>
            <Text size="xs" color="muted">·</Text>
            <Text size="xs" color="warning">{results.affectedRows} affected</Text>
          </>
        )}
      </Flex>
      <Flex direction="row" align="center" gap="xs">
        {actions}
        <Button
          variant="ghost"
          size="xs"
          onClick={() => handleExport('csv')}
          disabled={exporting}
          className="flex items-center gap-1 text-text-muted hover:text-text-primary h-auto py-0"
          title="Export as CSV"
        >
          <Download size={10} /> CSV
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => handleExport('json')}
          disabled={exporting}
          className="flex items-center gap-1 text-text-muted hover:text-text-primary h-auto py-0"
          title="Export as JSON"
        >
          <Download size={10} /> JSON
        </Button>
      </Flex>
    </Flex>
  )
}
