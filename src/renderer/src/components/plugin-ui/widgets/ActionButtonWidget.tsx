import { Button } from '@/primitives'
import { usePluginUIStore } from '@/stores/plugin-ui'
import type { ActionButtonWidget as ActionButtonWidgetType } from '@shared/plugin-ui-types'

interface Props {
  widget: ActionButtonWidgetType
  pluginId: string
}

export function ActionButtonWidgetRenderer({ widget, pluginId }: Props) {
  const executeAction = usePluginUIStore((s) => s.executeAction)

  if (widget.visible === false) return null

  return (
    <Button
      variant={widget.variant ?? 'ghost'}
      size="xs"
      onClick={() => executeAction(pluginId, widget.command, {})}
    >
      {widget.label}
    </Button>
  )
}
