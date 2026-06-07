import { useEffect, useState } from 'react'
import { Modal, Text, Badge, Divider, Button, Link } from '@/primitives'
import { VerqlMark } from '@/components/brand/VerqlMark'
import { IPC_CHANNELS } from '@shared/ipc'
import { useTranslation } from '@/i18n/I18nProvider'

const HOMEPAGE_URL = 'https://verql.arshadshah.com'
const GUIDE_URL = 'https://verql.arshadshah.com/guide/'
const SDK_URL = 'https://verql.arshadshah.com/plugins/sdk/'
const REPO_URL = 'https://github.com/arshad-shah/verql'
const ISSUES_URL = 'https://github.com/arshad-shah/verql/issues'
const LICENSE_URL = 'https://github.com/arshad-shah/verql/blob/main/LICENSE'

type AboutInfo = {
  name: string
  version: string
  electron: string
  chrome: string
  node: string
  v8: string
  os: string
  arch: string
}

const openExternal = (url: string) =>
  void window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_OPEN_EXTERNAL, url)

/** Custom in-app "About Verql": brand, version, the runtime versions baked into
 *  this build, license, and links — so we own the design rather than the OS's
 *  native about panel. Opened from Help → About via the ui store. */
export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const [info, setInfo] = useState<AboutInfo | null>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    window.electronAPI
      ?.invoke(IPC_CHANNELS.APP_ABOUT_INFO)
      .then((i) => { if (active) setInfo(i) })
      .catch(() => {})
    return () => { active = false }
  }, [open])

  const builds: [string, string | undefined][] = [
    ['Electron', info?.electron],
    ['Chromium', info?.chrome],
    ['Node', info?.node],
    ['V8', info?.v8],
    [t('about.platform'), info ? `${info.os} · ${info.arch}` : undefined],
  ]

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="p-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center gap-3">
          <VerqlMark size={56} />
          <div className="flex items-center gap-2">
            <Text size="xl" weight="bold" color="primary">{info?.name ?? 'Verql'}</Text>
            {info && <Badge variant="accent" size="sm">v{info.version}</Badge>}
          </div>
          <Text size="sm" color="secondary" className="max-w-sm">
            {t('about.tagline')}
          </Text>
        </div>

        <Divider className="my-5" />

        {/* Build versions */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {builds.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <Text size="xs" color="muted">{label}</Text>
              <Text size="xs" color="secondary" className="font-mono">{value ?? '—'}</Text>
            </div>
          ))}
        </div>

        <Divider className="my-5" />

        {/* License + links */}
        <div className="flex flex-col gap-2">
          <Text size="xs" color="muted">
            {t('about.license')} ·{' '}
            <Link size="sm" onClick={() => openExternal(LICENSE_URL)} className="cursor-pointer">
              {t('about.viewLicense')}
            </Link>
          </Text>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link size="sm" onClick={() => openExternal(HOMEPAGE_URL)} className="cursor-pointer">{t('about.website')}</Link>
            <Link size="sm" onClick={() => openExternal(GUIDE_URL)} className="cursor-pointer">{t('menu.userGuideShort')}</Link>
            <Link size="sm" onClick={() => openExternal(SDK_URL)} className="cursor-pointer">{t('menu.buildPlugin')}</Link>
            <Link size="sm" onClick={() => openExternal(REPO_URL)} className="cursor-pointer">{t('about.sourceCode')}</Link>
            <Link size="sm" onClick={() => openExternal(ISSUES_URL)} className="cursor-pointer">{t('menu.reportIssue')}</Link>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>{t('common.close')}</Button>
        </div>
      </div>
    </Modal>
  )
}
