import { useEffect, useRef } from 'react'
import type { AIProviderInfo, AIModelInfo } from '@shared/ai-types'
import { Text } from '@/primitives/typography/Text'
import { Card } from '@/primitives/surfaces/Card'
import { ScrollArea } from '@/primitives/layout/ScrollArea'

interface ModelPickerProps {
  providers: AIProviderInfo[]
  models: AIModelInfo[]
  activeModel: string | null
  onSelect: (modelId: string) => void
  onSelectProvider: (provider: AIProviderInfo) => void
  onDismiss: () => void
}

export function ModelPicker({ providers, models, activeModel, onSelect, onSelectProvider, onDismiss }: ModelPickerProps) {
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
      <Card padding="sm" className="shadow-[var(--shadow-dropdown)]">
        <ScrollArea direction="vertical" className="max-h-64">
          {providers.map(provider => (
            <div key={provider.id}>
              <button
                onClick={() => onSelectProvider(provider)}
                className="w-full text-left px-2 py-1 hover:bg-hover rounded transition-colors"
              >
                <Text size="xs" color="muted" weight="medium" className="uppercase tracking-wider">
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
                  <Text size="xs" color={model.id === activeModel ? 'accent' : 'primary'}>
                    {model.name}
                  </Text>
                </button>
              ))}
            </div>
          ))}
          {providers.length === 0 && (
            <div className="px-2 py-3">
              <Text size="xs" color="muted">No providers configured. Add API keys in Settings.</Text>
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  )
}
