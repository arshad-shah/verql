import { useState } from 'react'
import { Download, X } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { Modal, Button, Checkbox, Text, Flex, Spinner, Stack, Box } from '@/primitives'
import { IPC_CHANNELS } from '@shared/ipc'

interface Props {
  tableName?: string
  connectionId: string
  onClose: () => void
}

type ExportFormat = 'sql' | 'csv' | 'json'

export function ExportModal({ tableName, connectionId, onClose }: Props) {
  const [format, setFormat] = useState<ExportFormat>('sql')
  const [includeSchema, setIncludeSchema] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { connections } = useConnectionsStore()
  const conn = connections.find(c => c.id === connectionId)

  const handleExport = async () => {
    if (!tableName) return
    setExporting(true)
    try {
      const res = await window.electronAPI.invoke(IPC_CHANNELS.EXPORT_TABLE, connectionId, tableName, format, { includeSchema })
      if ('filePath' in res) {
        setResult(`Exported to ${res.filePath}`)
        setTimeout(onClose, 1500)
      }
    } catch (err) {
      setResult(`Error: ${(err as Error).message}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <Flex direction="row" align="center" justify="between" className="px-4 py-3 border-b border-border">
        <Text size="sm" weight="semibold">Export {tableName}</Text>
        <Button variant="ghost" size="xs" onClick={onClose} aria-label="Close"><X size={14} /></Button>
      </Flex>

      <Stack gap="md" className="p-4">
        <Box>
          <Text size="xs" color="muted" as="p" className="mb-2">Format</Text>
          <Flex direction="row" gap="sm">
            {(['sql', 'csv', 'json'] as ExportFormat[]).map(f => (
              <Button
                key={f}
                variant={format === f ? 'outline' : 'ghost'}
                size="sm"
                onClick={() => setFormat(f)}
                className={`flex-1 ${format === f ? 'border-accent text-accent bg-accent/10' : ''}`}
              >
                {f.toUpperCase()}
              </Button>
            ))}
          </Flex>
        </Box>

        {format === 'sql' && (
          <Flex direction="row" align="center" gap="sm" className="cursor-pointer" onClick={() => setIncludeSchema(v => !v)}>
            <Checkbox checked={includeSchema} onChange={e => setIncludeSchema(e.target.checked)} />
            <Text size="sm" color="secondary">Include CREATE TABLE</Text>
          </Flex>
        )}

        {result && (
          <Text size="xs" color={result.startsWith('Error') ? 'error' : 'success'} as="p">{result}</Text>
        )}
      </Stack>

      <Flex direction="row" justify="end" gap="sm" className="px-4 py-3 border-t border-border">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          variant="solid"
          size="sm"
          onClick={handleExport}
          disabled={exporting || !tableName}
          className="flex items-center gap-1.5"
        >
          {exporting ? <Spinner size="xs" /> : <Download size={14} />}
          Export
        </Button>
      </Flex>
    </Modal>
  )
}
