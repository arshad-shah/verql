import { Center } from '@arshad-shah/cynosure-react/center'
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
 *
 * Built on Cynosure layout primitives styled by props — colours flow through
 * the `--cynosure-*` bridge (styles/cynosure-bridge.css) so the active Verql
 * theme recolours it without any Tailwind.
 */
export function SplashScreen({ status = 'Starting Verql…' }: SplashScreenProps) {
  return (
    <Center
      minHeight="screen"
      // @ts-expect-error -- `100vw` is a valid CSS width but Cynosure's SizeValue type omits vw units
      width="100vw"
      background="bg.canvas"
      color="fg.default"
      role="status"
      aria-live="polite"
      style={{ userSelect: 'none' }}
    >
      <Stack gap="4" align="center">
        <VerqlHero size={120} />
        <Spinner size="lg" colorScheme="accent" label={status} />
        <Text size="md" color="fg.muted">
          {status}
        </Text>
      </Stack>
    </Center>
  )
}
