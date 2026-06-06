import { Component, type ReactNode } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Flex, Stack, Heading, Text, Button } from '@/primitives'
import { t } from '@shared/i18n'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Flex align="center" justify="center" className="h-screen bg-bg-primary">
          <Stack align="center" gap="sm" className="text-center max-w-md p-6">
            <AlertCircle size={48} className="text-error mx-auto mb-4" />
            <Heading level={4}>{t('shell.errorBoundary.title')}</Heading>
            <Text size="sm" color="secondary">
              {this.state.error?.message ?? t('shell.errorBoundary.fallbackMessage')}
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="mt-2 inline-flex items-center gap-2 bg-accent/10 text-accent border-0 hover:bg-accent/20"
            >
              <RotateCcw size={14} /> {t('shell.errorBoundary.tryAgain')}
            </Button>
          </Stack>
        </Flex>
      )
    }
    return this.props.children
  }
}
