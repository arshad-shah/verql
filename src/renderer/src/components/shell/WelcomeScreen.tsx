import { useMemo } from 'react'
import { Command, ArrowBigUp, Option, ChevronUp } from 'lucide-react'
import { Flex, Text, Kbd } from '@/primitives'
import appIconUrl from '@brand/icon-light.svg?url'

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform)

interface ShortcutHint {
  keys: string[]
  label: string
}

const SHORTCUTS: ShortcutHint[] = [
  { keys: ['mod', 'shift', 'p'], label: 'Command palette' },
  { keys: ['mod', 't'], label: 'New query tab' },
  { keys: ['mod', 'shift', 'n'], label: 'New connection' },
]

/**
 * Render a single key as either a Lucide icon (for modifiers) or a letter.
 * The wrapping `<Kbd>` provides the chip styling.
 */
function KeyChip({ k }: { k: string }) {
  const inner = (() => {
    if (k === 'mod') return IS_MAC ? <Command size={11} aria-label="Command" /> : <span>Ctrl</span>
    if (k === 'shift') return <ArrowBigUp size={12} aria-label="Shift" />
    if (k === 'alt') return IS_MAC ? <Option size={11} aria-label="Option" /> : <span>Alt</span>
    if (k === 'ctrl') return <ChevronUp size={12} aria-label="Control" />
    return <span>{k.toUpperCase()}</span>
  })()
  return <Kbd>{inner}</Kbd>
}

/**
 * Hero mark uses the official app icon (build/icon.svg) so the welcome
 * screen stays in lockstep with the dock/taskbar artwork.
 */
function HeroMark({ size = 140 }: { size?: number }) {
  return <img src={appIconUrl} width={size} height={size} alt="" aria-hidden="true" />
}

export function WelcomeScreen() {
  const shortcuts = useMemo(() => SHORTCUTS, [])

  return (
    <Flex align="center" justify="center" className="flex-1 bg-bg-tertiary h-full">
      <Flex direction="column" align="center" gap="lg" className="text-center">
        <HeroMark size={140} />
        <Flex direction="column" gap="sm" align="start" justify="between">
          {shortcuts.map(({ keys, label }) => (
            <Flex key={label} align="center" gap="sm">
              <Text size="sm" color="secondary">{label}</Text>
              {keys.map((k, i) => (
                <KeyChip key={i} k={k} />
              ))}
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Flex>
  )
}
