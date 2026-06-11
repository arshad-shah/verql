import { FileQuestion } from 'lucide-react'
import { Flex, ScrollArea, EmptyState, Button } from '@/primitives'
import { useTranslation } from '@/i18n/I18nProvider'
import { useTabsStore } from '@/stores/tabs'
import { getReleaseNote } from '@/lib/release-notes'
import { ReleaseNotesContent } from './ReleaseNotesContent'

/**
 * The "What's New" editor tab. Resolves a version to its curated release note
 * and renders it, or an empty state when none is authored (e.g. a stale tab for
 * a version that no longer ships notes).
 */
export function ReleaseNotesView({ version }: { version: string }) {
  const { t } = useTranslation()
  const note = getReleaseNote(version)

  if (!note) {
    return (
      <Flex align="center" justify="center" className="h-full bg-bg-tertiary">
        <EmptyState
          size="lg"
          icon={<FileQuestion size={32} className="text-text-muted" />}
          title={t('shell.releaseNotes.notFoundTitle')}
          description={t('shell.releaseNotes.notFoundDescription', { version })}
          action={
            <Button size="sm" variant="outline" onClick={() => useTabsStore.getState().openWelcome()}>
              {t('shell.releaseNotes.backToWelcome')}
            </Button>
          }
        />
      </Flex>
    )
  }

  return (
    <ScrollArea className="h-full bg-bg-tertiary">
      <ReleaseNotesContent note={note} />
    </ScrollArea>
  )
}
