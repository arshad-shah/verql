import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Modal, Button, Input, Text, Flex, Spinner, Stack, Box } from '@/primitives'

interface Props {
  connectionId: string
  onClose: () => void
}

type ImportType = 'csv' | 'sql'

export function ImportModal({ connectionId, onClose }: Props) {
  const [importType, setImportType] = useState<ImportType>('sql')
  const [tableName, setTableName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleImportSql = async () => {
    setImporting(true)
    try {
      const res = await window.electronAPI.invoke('import:sql', connectionId)
      if ('cancelled' in res) { setImporting(false); return }
      const msg = `Executed ${res.executed} statements` + (res.errors.length > 0 ? ` (${res.errors.length} errors)` : '')
      setResult(msg)
      if (res.errors.length === 0) setTimeout(onClose, 1500)
    } catch (err) {
      setResult(`Error: ${(err as Error).message}`)
    } finally {
      setImporting(false)
    }
  }

  const handleImportCsv = async () => {
    if (!tableName.trim()) return
    setImporting(true)
    try {
      // Simple 1:1 column mapping — CSV headers match DB columns
      const mapping: Record<string, string> = {}
      // We'll let the backend figure out the mapping from CSV headers
      const res = await window.electronAPI.invoke('import:csv', connectionId, tableName, mapping, 'skip')
      if ('cancelled' in res) { setImporting(false); return }
      const msg = `Inserted ${res.inserted} rows` + (res.skipped > 0 ? `, ${res.skipped} skipped` : '') + (res.errors.length > 0 ? `, ${res.errors.length} errors` : '')
      setResult(msg)
      if (res.errors.length === 0) setTimeout(onClose, 1500)
    } catch (err) {
      setResult(`Error: ${(err as Error).message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <Flex direction="row" align="center" justify="between" className="px-4 py-3 border-b border-border">
        <Text size="sm" weight="semibold">Import Data</Text>
        <Button variant="ghost" size="xs" onClick={onClose} aria-label="Close">&times;</Button>
      </Flex>

      <Stack gap="md" className="p-4">
        <Box>
          <Text size="xs" color="muted" as="p" className="mb-2">Import Type</Text>
          <Flex direction="row" gap="sm">
            {(['sql', 'csv'] as ImportType[]).map(t => (
              <Button
                key={t}
                variant={importType === t ? 'outline' : 'ghost'}
                size="sm"
                onClick={() => setImportType(t)}
                className={`flex-1 ${importType === t ? 'border-accent text-accent bg-accent/10' : ''}`}
              >
                {t.toUpperCase()}
              </Button>
            ))}
          </Flex>
        </Box>

        {importType === 'sql' && (
          <Text size="xs" color="secondary" as="p">Select a .sql file to execute all statements against the connected database.</Text>
        )}

        {importType === 'csv' && (
          <Box>
            <Text size="xs" color="muted" as="p" className="mb-1">Target Table</Text>
            <Input
              value={tableName}
              onChange={e => setTableName(e.target.value)}
              placeholder="table_name"
              size="sm"
            />
            <Text size="xs" color="muted" as="p" className="mt-1">CSV column headers must match table column names.</Text>
          </Box>
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
          onClick={importType === 'sql' ? handleImportSql : handleImportCsv}
          disabled={importing || (importType === 'csv' && !tableName.trim())}
          className="flex items-center gap-1.5"
        >
          {importing ? <Spinner size="xs" /> : <Upload size={14} />}
          Import
        </Button>
      </Flex>
    </Modal>
  )
}
