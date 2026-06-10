import { useState } from 'react'
import { Download } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@arshad-shah/cynosure-react/dialog'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Stack } from '@arshad-shah/cynosure-react/stack'
import { Box } from '@arshad-shah/cynosure-react/box'
import { Checkbox } from '@arshad-shah/cynosure-react/checkbox'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Button } from '@arshad-shah/cynosure-react/button'
import { IPC_CHANNELS } from '@shared/ipc'
import { useTranslation } from '@/i18n/I18nProvider'

interface Props {
  tableName?: string
  connectionId: string
  onClose: () => void
}

type ExportFormat = 'sql' | 'csv' | 'json'

export function ExportModal({ tableName, connectionId, onClose }: Props) {
  const { t } = useTranslation()
  const [format, setFormat] = useState<ExportFormat>('sql')
  const [includeSchema, setIncludeSchema] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [result, setResult] = useState<{ text: string; isError: boolean } | null>(null)
  const { connections } = useConnectionsStore()
  const conn = connections.find(c => c.id === connectionId)

  const handleExport = async () => {
    if (!tableName) return
    setExporting(true)
    try {
      const res = await window.electronAPI.invoke(IPC_CHANNELS.EXPORT_TABLE, connectionId, tableName, format, { includeSchema })
      if ('filePath' in res) {
        setResult({ text: t('shell.exportModal.exportedTo', { filePath: res.filePath }), isError: false })
        setTimeout(onClose, 1500)
      }
    } catch (err) {
      setResult({ text: t('shell.exportModal.errorPrefix', { message: (err as Error).message }), isError: true })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent closeLabel={t('shell.exportModal.close')}>
        <DialogHeader>
          <DialogTitle>{t('shell.exportModal.title', { tableName: tableName ?? '' })}</DialogTitle>
        </DialogHeader>

        <Stack gap="3">
          <Box>
            <Text size="xs" color="fg.subtle" as="p" className="mb-2">{t('shell.exportModal.format')}</Text>
            <Flex direction="row" gap="2">
              {(['sql', 'csv', 'json'] as ExportFormat[]).map(f => (
                <Button
                  key={f}
                  variant={format === f ? 'soft' : 'ghost'}
                  colorScheme={format === f ? 'accent' : 'neutral'}
                  size="sm"
                  onClick={() => setFormat(f)}
                  className="flex-1"
                >
                  {f.toUpperCase()}
                </Button>
              ))}
            </Flex>
          </Box>

          {format === 'sql' && (
            <Flex direction="row" align="center" gap="2" className="cursor-pointer" onClick={() => setIncludeSchema(v => !v)}>
              <Checkbox checked={includeSchema} onCheckedChange={(c) => setIncludeSchema(c === true)} />
              <Text size="sm" color="fg.muted">{t('shell.exportModal.includeCreateTable')}</Text>
            </Flex>
          )}

          {result && (
            <Text size="xs" color={result.isError ? 'feedback.danger.foreground' : 'feedback.success.foreground'} as="p">{result.text}</Text>
          )}
        </Stack>

        <DialogFooter>
          <Button variant="outline" colorScheme="neutral" size="sm" onClick={onClose}>{t('shell.exportModal.cancel')}</Button>
          <Button
            size="sm"
            onClick={handleExport}
            loading={exporting}
            disabled={!tableName}
            leftIcon={<Download size={14} />}
          >
            {t('shell.exportModal.export')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
