import { useEffect, useRef } from 'react'
import type { AIProviderInfo, AIModelInfo } from '@shared/ai-types'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Card, CardBody } from '@arshad-shah/cynosure-react/card'
import { ScrollArea } from '@arshad-shah/cynosure-react/scroll-area'
import { useTranslation } from '@/i18n/I18nProvider'

interface ModelPickerProps {
  providers: AIProviderInfo[]
  models: AIModelInfo[]
  activeModel: string | null
  onSelect: (modelId: string) => void
  onSelectProvider: (provider: AIProviderInfo) => void
  onDismiss: () => void
}

export function ModelPicker({ providers, models, activeModel, onSelect, onSelectProvider, onDismiss }: ModelPickerProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onDismiss])

  return (
    <div ref={ref} className="absolute bottom-full left-3 right-3 mb-1 z-50">
      <Card size="sm" className="shadow-[var(--shadow-dropdown)]">
        <CardBody>
        <ScrollArea scrollbars="vertical" className="max-h-64">
          {providers.map(provider => (
            <div key={provider.id}>
              <button
                onClick={() => onSelectProvider(provider)}
                className="w-full text-left px-2 py-1 hover:bg-hover rounded transition-colors"
              >
                <Text size="xs" color="fg.subtle" weight="medium" className="uppercase tracking-wider">
                  {provider.name}
                </Text>
              </button>
              {models.map(model => (
                <button
                  key={model.id}
                  onClick={() => onSelect(model.id)}
                  className={`w-full text-left px-2 py-1.5 rounded transition-colors ${
                    model.id === activeModel
                      ? 'bg-accent/10 text-accent'
                      : 'hover:bg-hover'
                  }`}
                >
                  <Text size="xs" color={model.id === activeModel ? 'accent.solid' : undefined}>
                    {model.name}
                  </Text>
                </button>
              ))}
            </div>
          ))}
          {providers.length === 0 && (
            <div className="px-2 py-3">
              <Text size="xs" color="fg.subtle">{t('aiui.chat.providersEmpty')}</Text>
            </div>
          )}
        </ScrollArea>
        </CardBody>
      </Card>
    </div>
  )
}
