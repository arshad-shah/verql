import { StatusBarSegment } from './StatusBarSegment'
import { useTranslation } from '@/i18n/I18nProvider'

const isDev = import.meta.env.DEV

export function DevSegment() {
  const { t } = useTranslation()
  if (!isDev) return null
  return (
    <StatusBarSegment tone="dev" side="right" aria-label={t('shell.statusBar.devBuild')}>
      {t('shell.statusBar.dev')}
    </StatusBarSegment>
  )
}
