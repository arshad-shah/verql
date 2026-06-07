import { useEffect, useState } from 'react'
import { Globe, BookOpen, Puzzle, Code2, AlertCircle, Copy, Check, X, type LucideIcon } from 'lucide-react'
import { Modal, Text, Badge, Divider, Button } from '@/primitives'
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

/** Custom in-app "About Verql" — a hero-split modal (branded panel + a copyable
 *  build block and resource links) so we own the design rather than the OS's
 *  native about panel. Opened from Help → About via the ui store. */
export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const [info, setInfo] = useState<AboutInfo | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true
    window.electronAPI
      ?.invoke(IPC_CHANNELS.APP_ABOUT_INFO)
      .then((i) => { if (active) setInfo(i) })
      .catch(() => {})
    return () => { active = false }
  }, [open])

  // Reset the copied affordance whenever the modal reopens.
  useEffect(() => { if (!open) setCopied(false) }, [open])

  const rows: [string, string][] = info
    ? [
        ['electron', info.electron],
        ['node', info.node],
        ['chromium', info.chrome],
        ['v8', info.v8],
        ['platform', `${info.os} · ${info.arch}`],
      ]
    : []
  const buildText = rows.map(([k, v]) => `${k.padEnd(10)}${v}`).join('\n')

  const copyBuild = async () => {
    try { await navigator.clipboard.writeText(`Verql v${info?.version ?? ''}\n${buildText}`) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  const links: { label: string; icon: LucideIcon; url: string }[] = [
    { label: t('about.website'), icon: Globe, url: HOMEPAGE_URL },
    { label: t('menu.userGuideShort'), icon: BookOpen, url: GUIDE_URL },
    { label: t('menu.buildPlugin'), icon: Puzzle, url: SDK_URL },
    { label: t('about.sourceCode'), icon: Code2, url: REPO_URL },
    { label: t('menu.reportIssue'), icon: AlertCircle, url: ISSUES_URL },
  ]

  return (
    <Modal open={open} onClose={onClose} size="lg" className="overflow-hidden">
      <div className="flex max-sm:flex-col">
        {/* Brand hero */}
        <div
          className="w-[230px] shrink-0 max-sm:w-full flex flex-col gap-4 p-7 justify-center border-r border-border-default max-sm:border-r-0 max-sm:border-b"
          style={{
            background:
              'radial-gradient(150px 150px at 28% 18%, color-mix(in oklab, var(--color-accent) 26%, transparent), transparent 70%),' +
              'linear-gradient(160deg, color-mix(in oklab, var(--color-accent) 12%, var(--color-bg-primary)), var(--color-bg-primary))',
          }}
        >
          <VerqlMark size={60} />
          <div>
            <Text size="xl" weight="bold" color="primary">Verql</Text>
            {info && <div className="mt-1.5"><Badge variant="accent" size="sm">v{info.version}</Badge></div>}
          </div>
          <Text size="sm" color="secondary" className="leading-relaxed">{t('about.tagline')}</Text>
          <div className="flex-1 max-sm:hidden" />
          <Text size="xs" color="muted">{t('about.license')}</Text>
        </div>

        {/* Build + resources */}
        <div className="relative flex-1 p-6">
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="absolute top-3 right-3 grid place-items-center w-7 h-7 rounded-md text-text-muted hover:text-text-primary hover:bg-hover"
          >
            <X size={15} />
          </button>

          <Text size="xs" color="muted" className="uppercase tracking-wider">Build</Text>
          <div className="relative mt-2">
            <pre className="m-0 font-mono text-[11.5px] leading-relaxed text-text-secondary bg-bg-inset border border-border-default rounded-lg p-3 overflow-auto">
              {buildText || '…'}
            </pre>
            <button
              type="button"
              onClick={copyBuild}
              className="absolute top-2 right-2 flex items-center gap-1.5 rounded-md border border-border-default px-2 py-1 text-[11px] text-text-secondary hover:bg-hover hover:border-border-strong"
            >
              {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
              {copied ? t('about.copied') : t('about.copy')}
            </button>
          </div>

          <Divider className="my-4" />

          <Text size="xs" color="muted" className="uppercase tracking-wider">{t('about.resources')}</Text>
          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
            {links.map(({ label, icon: Icon, url }) => (
              <button
                key={label}
                type="button"
                onClick={() => openExternal(url)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-text-secondary hover:text-text-primary hover:bg-hover text-left"
              >
                <Icon size={15} className="shrink-0 text-text-tertiary" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          <Divider className="my-4" />

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => openExternal(LICENSE_URL)} className="text-[12px] text-accent hover:underline">
              {t('about.viewLicense')}
            </button>
            <Button variant="outline" size="sm" onClick={onClose}>{t('common.close')}</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
