import { useEffect, useState } from 'react'
import { Globe, BookOpen, Puzzle, Code2, AlertCircle, Copy, Check, X, type LucideIcon } from 'lucide-react'
import { Modal, Badge, KeyValue, Link, GradientSurface } from '@/primitives'
import { Divider } from '@arshad-shah/cynosure-react/divider'
import { Box } from '@arshad-shah/cynosure-react/box'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Stack } from '@arshad-shah/cynosure-react/stack'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Button } from '@arshad-shah/cynosure-react/button'
import { IconButton } from '@arshad-shah/cynosure-react/icon-button'
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

/** Custom in-app "About Verql" — a hero-split modal (branded panel + the build
 *  versions as KeyValue rows with a copy-all action, plus resource links) so we
 *  own the design rather than the OS's native about panel. Opened from
 *  Help → About via the ui store. Built from primitives throughout. */
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

  const copyBuild = async () => {
    const buildText = rows.map(([k, v]) => `${k.padEnd(10)}${v}`).join('\n')
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
      <Flex className="max-sm:flex-col">
        {/* Brand hero */}
        <GradientSurface className="w-[230px] shrink-0 max-sm:w-full border-r border-border-default max-sm:border-r-0 max-sm:border-b">
          <Flex direction="column" gap="4" justify="center" className="h-full p-7">
            <VerqlMark size={60} />
            <Stack gap="1">
              <Text size="xl" weight="bold">Verql</Text>
              {info && <Box><Badge variant="accent" size="sm">v{info.version}</Badge></Box>}
            </Stack>
            <Text size="sm" color="fg.muted" className="leading-relaxed">{t('about.tagline')}</Text>
            <Box className="flex-1 max-sm:hidden" />
            <Text size="xs" color="fg.subtle">{t('about.license')}</Text>
          </Flex>
        </GradientSurface>

        {/* Build + resources */}
        <Box padding="6" className="relative flex-1">
          <IconButton
            variant="ghost"
            colorScheme="neutral"
            size="xs"
            label={t('common.close')}
            onClick={onClose}
            className="absolute top-3 right-3"
            icon={<X size={15} />}
          />

          {/* Offset below the modal's absolute close (×) so the copy button
              never overlaps it. */}
          <Flex align="center" justify="between" className="mt-5">
            <Text size="xs" color="fg.subtle" className="uppercase tracking-wider">Build</Text>
            <IconButton variant="ghost" colorScheme="neutral" size="xs" label={copied ? t('about.copied') : t('about.copy')} onClick={copyBuild} icon={copied ? <Check size={13} className="text-accent" /> : <Copy size={13} />} />
          </Flex>
          <Flex direction="column" gap="1" className="mt-1 rounded-lg border border-border-default bg-bg-inset px-3 py-2.5">
            {rows.length === 0
              ? <Text size="xs" color="fg.subtle">…</Text>
              : rows.map(([k, v]) => <KeyValue key={k} label={k} value={v} monospace size="sm" />)}
          </Flex>

          <Divider className="my-4" />

          <Text size="xs" color="fg.subtle" className="uppercase tracking-wider">{t('about.resources')}</Text>
          <Box className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
            {links.map(({ label, icon: Icon, url }) => (
              <Button
                key={label}
                variant="ghost"
                colorScheme="neutral"
                size="sm"
                fullWidth
                onClick={() => openExternal(url)}
                leftIcon={<Icon size={15} className="shrink-0 text-text-tertiary" />}
                className="justify-start font-normal"
              >
                <span className="truncate">{label}</span>
              </Button>
            ))}
          </Box>

          <Divider className="my-4" />

          <Flex align="center" justify="between">
            <Link size="sm" onClick={() => openExternal(LICENSE_URL)} className="cursor-pointer">
              {t('about.viewLicense')}
            </Link>
            <Button variant="outline" colorScheme="neutral" size="sm" onClick={onClose}>{t('common.close')}</Button>
          </Flex>
        </Box>
      </Flex>
    </Modal>
  )
}
