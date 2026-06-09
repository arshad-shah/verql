import { Component, type ReactNode } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Flex, Stack } from '@/primitives'
import { Heading } from '@arshad-shah/cynosure-react/heading'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Button } from '@arshad-shah/cynosure-react/button'
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
            <Text size="sm" color="fg.muted">
              {this.state.error?.message ?? t('shell.errorBoundary.fallbackMessage')}
            </Text>
            <Button
              variant="soft"
              colorScheme="accent"
              size="sm"
              onClick={this.handleReset}
              leftIcon={<RotateCcw size={14} />}
              className="mt-2"
            >
              {t('shell.errorBoundary.tryAgain')}
            </Button>
          </Stack>
        </Flex>
      )
    }
    return this.props.children
  }
}
