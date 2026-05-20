// shared/plugin-ui-types.ts

// ─── Widget Base ────────────────────────────────────────────────────────────

export interface WidgetBase {
  id: string
  type: string
  visible?: boolean
  tooltip?: string
}

// ─── Widget Types ───────────────────────────────────────────────────────────

export interface SelectorWidget extends WidgetBase {
  type: 'selector'
  label: string
  options?: { value: string; label: string }[]
  resolver?: string
  value?: string
  onChange: string
  searchable?: boolean
}

export interface ActionButtonWidget extends WidgetBase {
  type: 'action-button'
  label: string
  icon?: string
  command: string
  variant?: 'primary' | 'secondary' | 'ghost'
}

export interface StatusIndicatorWidget extends WidgetBase {
  type: 'status-indicator'
  label: string
  icon: string
  status?: 'ok' | 'warning' | 'error' | 'loading'
}

export interface TextWidget extends WidgetBase {
  type: 'text'
  content: string
  style?: 'label' | 'value' | 'muted'
}

export interface TreeWidget extends WidgetBase {
  type: 'tree'
  resolver: string
  onSelect?: string
}

export interface ListWidget extends WidgetBase {
  type: 'list'
  items?: { id: string; label: string; icon?: string; action?: string }[]
  resolver?: string
}

export interface SectionWidget extends WidgetBase {
  type: 'section'
  label: string
  collapsible?: boolean
  collapsed?: boolean
  children: Widget[]
}

export interface SeparatorWidget extends WidgetBase {
  type: 'separator'
}

/**
 * Escape hatch for plugins that need to render a full React component the host
 * already knows about (e.g. AI chat, ER diagram). The host maps `componentId`
 * to a concrete component in its renderer bundle. The contribution disappears
 * when the plugin is deactivated, so the host should treat presence of this
 * widget as the gate for mounting.
 */
export interface HostComponentWidget extends WidgetBase {
  type: 'host-component'
  componentId: string
  /** Free-form props forwarded to the host component. */
  props?: Record<string, unknown>
}

export type Widget =
  | SelectorWidget
  | ActionButtonWidget
  | StatusIndicatorWidget
  | TextWidget
  | TreeWidget
  | ListWidget
  | SectionWidget
  | SeparatorWidget
  | HostComponentWidget

// ─── Contribution Surfaces ──────────────────────────────────────────────────

export type StatusBarZone = 'left' | 'center' | 'right'
export type ActivityBarZone = 'top' | 'bottom'
export type ContextMenuTarget = 'table' | 'column' | 'connection' | 'tab'
export type SelectorZone = 'statusBar.left' | 'statusBar.right' | 'panel'

// ─── Manifest Contribution Types ────────────────────────────────────────────

export interface ActivityBarContribution {
  id: string
  title: string
  icon: string
  zone?: ActivityBarZone
}

export interface StatusBarContribution {
  id: string
  zone: StatusBarZone
}

export interface ContextMenuContribution {
  id: string
  target: ContextMenuTarget
  label: string
  command: string
}

export interface TabContribution {
  id: string
  title: string
  icon: string
}

export interface SelectorContribution {
  id: string
  label: string
  zone: SelectorZone
  resolver?: string
  options?: { value: string; label: string }[]
  onChange: string
}

// ─── IPC Payloads ───────────────────────────────────────────────────────────

export type ContributionSurface = 'activityBar' | 'statusBar' | 'toolbar' | 'contextMenu' | 'tabs' | 'panels'

export interface UIContribution {
  pluginId: string
  pluginName: string
  surface: ContributionSurface
  contributionId: string
  widgets: Widget[]
  meta: Record<string, unknown>
}

export interface ResolverContext {
  connectionId: string
}

// ─── Completion Types ──────────────────────────────────────────────────────

export type CompletionItemKind = 'keyword' | 'table' | 'column' | 'function' | 'collection' | 'command' | 'field' | 'operator' | 'snippet'

export interface CompletionItem {
  label: string
  kind: CompletionItemKind
  detail?: string
  insertText?: string
  sortText?: string
}

export interface CompletionContext {
  connectionId: string
  schema?: string
}
