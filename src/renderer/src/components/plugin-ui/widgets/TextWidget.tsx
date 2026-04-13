import { Text } from '@/primitives'
import type { TextWidget as TextWidgetType } from '@shared/plugin-ui-types'

interface Props {
  widget: TextWidgetType
}

const styleMap: Record<string, string> = {
  label: 'text-text-muted uppercase tracking-wider',
  value: 'text-text-primary',
  muted: 'text-text-disabled',
}

export function TextWidgetRenderer({ widget }: Props) {
  if (widget.visible === false) return null

  return (
    <Text size="xs" className={styleMap[widget.style ?? 'value']}>
      {widget.content}
    </Text>
  )
}
