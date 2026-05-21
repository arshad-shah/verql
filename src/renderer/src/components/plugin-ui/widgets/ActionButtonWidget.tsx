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

  // Translate the plugin manifest's variant vocabulary (primary/secondary/ghost)
  // into the design-system Button's variants (solid/outline/ghost). Plugins
  // see a stable, semantic API; the primitive owns its own styling.
  const variantMap = { primary: 'solid', secondary: 'outline', ghost: 'ghost' } as const
  const variant = variantMap[widget.variant ?? 'ghost'] ?? 'ghost'

  return (
    <Button
      variant={variant}
      size="xs"
      onClick={() => executeAction(pluginId, widget.command, {})}
    >
      {widget.label}
    </Button>
  )
}
