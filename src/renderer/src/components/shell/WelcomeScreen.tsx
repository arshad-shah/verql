import { useMemo } from 'react'
import { Command, ArrowBigUp, Option, ChevronUp } from 'lucide-react'
import { Flex, Text, Kbd } from '@/primitives'

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
 * Inline-rendered hero mark. Unlike `<NovaHero>` (which uses a CSS mask and
 * flattens opacity), this preserves the SVG's internal opacity layers so the
 * concentric rings and secondary rays read in any theme. `currentColor` makes
 * it inherit the active theme's accent color.
 */
function HeroMark({ size = 140 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="86" strokeWidth="1" opacity="0.12" />
      <circle cx="100" cy="100" r="58" strokeWidth="1" opacity="0.22" />

      <g strokeWidth="2.2" strokeLinecap="round">
        <line x1="100" y1="10" x2="100" y2="46" />
        <line x1="100" y1="154" x2="100" y2="190" />
        <line x1="10" y1="100" x2="46" y2="100" />
        <line x1="154" y1="100" x2="190" y2="100" />
      </g>

      <g strokeWidth="1.6" strokeLinecap="round" opacity="0.6">
        <line x1="38" y1="38" x2="62" y2="62" />
        <line x1="162" y1="38" x2="138" y2="62" />
        <line x1="38" y1="162" x2="62" y2="138" />
        <line x1="162" y1="162" x2="138" y2="138" />
      </g>

      <g strokeWidth="1.2" strokeLinecap="round" opacity="0.35">
        <line x1="70" y1="22" x2="76" y2="44" />
        <line x1="130" y1="22" x2="124" y2="44" />
        <line x1="70" y1="178" x2="76" y2="156" />
        <line x1="130" y1="178" x2="124" y2="156" />
        <line x1="22" y1="70" x2="44" y2="76" />
        <line x1="178" y1="70" x2="156" y2="76" />
        <line x1="22" y1="130" x2="44" y2="124" />
        <line x1="178" y1="130" x2="156" y2="124" />
      </g>

      <circle cx="100" cy="100" r="22" fill="currentColor" opacity="0.12" stroke="none" />
      <circle cx="100" cy="100" r="14" fill="currentColor" opacity="0.35" stroke="none" />
      <circle cx="100" cy="100" r="7" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function WelcomeScreen() {
  const shortcuts = useMemo(() => SHORTCUTS, [])

  return (
    <Flex align="center" justify="center" className="flex-1 bg-bg-tertiary h-full">
      <Flex direction="column" align="center" gap="lg" className="text-center">
        <span className="text-text-quaternary">
          <HeroMark size={140} />
        </span>
        <Flex direction="column" gap="sm" align="center">
          {shortcuts.map(({ keys, label }) => (
            <Flex key={label} align="center" gap="sm">
              {keys.map((k, i) => (
                <KeyChip key={i} k={k} />
              ))}
              <Text size="xs" color="muted">{label}</Text>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Flex>
  )
}
