import type { Widget } from '@shared/plugin-ui-types'
import { Popover, PopoverContent, PopoverTrigger } from '@arshad-shah/cynosure-react/popover'
import { SelectorWidgetRenderer } from './widgets/SelectorWidget'
import { ActionButtonWidgetRenderer } from './widgets/ActionButtonWidget'
import { StatusIndicatorWidgetRenderer } from './widgets/StatusIndicatorWidget'
import { TextWidgetRenderer } from './widgets/TextWidget'
import { SectionWidgetRenderer } from './widgets/SectionWidget'

interface Props {
  widgets: Widget[]
  pluginId: string
}

function renderWidget(widget: Widget, pluginId: string) {
  switch (widget.type) {
    case 'selector':
      return <SelectorWidgetRenderer key={widget.id} widget={widget} pluginId={pluginId} />
    case 'action-button':
      return <ActionButtonWidgetRenderer key={widget.id} widget={widget} pluginId={pluginId} />
    case 'status-indicator':
      return <StatusIndicatorWidgetRenderer key={widget.id} widget={widget} />
    case 'text':
      return <TextWidgetRenderer key={widget.id} widget={widget} />
    case 'section':
      return <SectionWidgetRenderer key={widget.id} widget={widget} pluginId={pluginId} />
    case 'separator':
      return <hr key={widget.id} className="border-border-default my-1" />
    case 'popover':
      return (
        <Popover key={widget.id}>
          <PopoverTrigger asChild>{renderWidget(widget.trigger, pluginId)}</PopoverTrigger>
          <PopoverContent side="top">
            <WidgetRenderer widgets={widget.content} pluginId={pluginId} />
          </PopoverContent>
        </Popover>
      )
    default:
      return null
  }
}

export function WidgetRenderer({ widgets, pluginId }: Props) {
  return <>{widgets.map((widget) => renderWidget(widget, pluginId))}</>
}
