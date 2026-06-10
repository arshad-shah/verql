import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Stack } from '@arshad-shah/cynosure-react/stack'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Spinner } from '@arshad-shah/cynosure-react/spinner'
import { VerqlHero } from '@/components/brand/VerqlHero'

interface SplashScreenProps {
  /** Optional status text shown beneath the mark (e.g. "Loading settings…"). */
  status?: string
}

/**
 * Full-window boot splash. Rendered before settings hydrate so the user sees a
 * branded loading state instead of a blank pane. Stays mounted until the first
 * post-hydration render of <App>.
 */
export function SplashScreen({ status = 'Starting Verql…' }: SplashScreenProps) {
  return (
    <Flex
      align="center"
      justify="center"
      className="h-screen w-screen bg-bg-primary text-text-primary select-none"
      role="status"
      aria-live="polite"
    >
      <Stack gap="4" align="center">
        <VerqlHero size={120} className="text-accent" />
        <Spinner size="lg" label={status} />
        <Text size="md" color="fg.subtle">{status}</Text>
      </Stack>
    </Flex>
  )
}
