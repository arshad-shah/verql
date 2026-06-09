import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Flex, Stack, Code } from '@/primitives'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Button } from '@arshad-shah/cynosure-react/button'

interface Props {
  /** Short name shown in the recovery UI (e.g. "Query Editor", "Sidebar"). */
  label: string
  /**
   * When this prop changes, the boundary auto-resets. Pass something
   * identifying the surrounding context (e.g. activeTabId) so navigating
   * away clears a stale error.
   */
  resetKey?: unknown
  /** Optional fallback override; falls back to the inline default. */
  fallback?: (error: Error, retry: () => void) => ReactNode
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Scoped error boundary. Wraps an individual section (a tab body, the sidebar,
 * a panel) so a render-time crash there doesn't tear down the whole window;
 * the user can keep using siblings and retry the broken area.
 *
 * Resets automatically when `resetKey` changes, otherwise the user clicks Retry.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidUpdate(prevProps: Props): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    // Surface in dev console for diagnosis without sending the user to an
    // unrecoverable global error screen.
    console.error(`[${this.props.label}] crashed:`, error, info)
  }

  private retry = () => this.setState({ hasError: false, error: null })

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback && this.state.error) {
      return this.props.fallback(this.state.error, this.retry)
    }

    return (
      <Flex align="center" justify="center" className="h-full w-full p-6">
        <Stack gap="sm" align="center" className="max-w-md text-center">
          <AlertTriangle size={28} className="text-warning" />
          <Text size="sm" weight="medium">{this.props.label} crashed</Text>
          <Text size="xs" color="fg.subtle">
            The rest of the app is still working. Retry this section or switch to another tab.
          </Text>
          {this.state.error && (
            <Code block className="text-[11px] max-h-32 overflow-auto text-left w-full whitespace-pre-wrap">
              {this.state.error.message}
            </Code>
          )}
          <Button size="sm" variant="outline" colorScheme="neutral" onClick={this.retry} leftIcon={<RotateCcw size={12} />}>
            Retry
          </Button>
        </Stack>
      </Flex>
    )
  }
}
