import { Flex, Text, Badge } from '@/primitives'
import appIconUrl from '@brand/icon-light.svg?url'
import { useTranslation } from '@/i18n/I18nProvider'

const isDev = import.meta.env.DEV

export function TitleBar() {
  const { t } = useTranslation()
  return (
    <Flex
      align="center"
      className="drag-region h-10 bg-bg-primary px-4 border-b border-border shrink-0"
    >
      <Flex align="center" gap="sm" className="ml-20 no-drag">
        <img src={appIconUrl} width={18} height={18} alt="" aria-hidden="true" />
        <Text size="sm" weight="semibold" color="primary" className="tracking-wide">{t('shell.titleBar.appName')}</Text>
        {isDev && (
          <Badge variant="warning" size="sm" className="text-[9px] leading-none">{t('shell.statusBar.dev')}</Badge>
        )}
      </Flex>
    </Flex>
  )
}
