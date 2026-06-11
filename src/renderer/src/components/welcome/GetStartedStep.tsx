import { Check, type LucideIcon } from 'lucide-react'
import { Flex, Box, Text, Button } from '@/primitives'
import { cn } from '@/primitives'

export interface GetStartedStepProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel: string
  /** Whether this step is satisfied (auto-detected or manually marked). */
  done: boolean
  /** Localized "Done" label for the completed badge. */
  doneLabel: string
  /** Runs the step's primary action (e.g. open the connection form). */
  onAction: () => void
}

/**
 * One row of the Welcome "Get Started" checklist: a status disc, the step's
 * title + description, and a primary action. Purely presentational — the parent
 * owns completion state and the action callback — so it stays storyable.
 */
export function GetStartedStep({
  icon: Icon,
  title,
  description,
  actionLabel,
  done,
  doneLabel,
  onAction,
}: GetStartedStepProps) {
  return (
    <Flex
      align="center"
      gap="md"
      className={cn(
        'rounded-lg border px-4 py-3 transition-colors',
        done
          ? 'border-border-subtle bg-bg-secondary/40'
          : 'border-border-default bg-bg-secondary hover:border-border-strong',
      )}
    >
      <Box
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          done ? 'bg-success/15 text-success' : 'bg-accent/10 text-accent',
        )}
      >
        {done ? <Check size={18} /> : <Icon size={18} />}
      </Box>

      <Flex direction="column" className="min-w-0 flex-1">
        <Text size="sm" weight="semibold" color="primary" className={cn(done && 'line-through opacity-70')}>
          {title}
        </Text>
        <Text size="xs" color="muted" className="leading-relaxed">
          {description}
        </Text>
      </Flex>

      {done ? (
        <Flex align="center" gap="xs" className="shrink-0 text-success">
          <Check size={14} />
          <Text size="xs" weight="medium" color="success">{doneLabel}</Text>
        </Flex>
      ) : (
        <Button variant="outline" size="sm" onClick={onAction} className="shrink-0">
          {actionLabel}
        </Button>
      )}
    </Flex>
  )
}
