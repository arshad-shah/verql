export const command = {
  searchPlaceholder: 'Type a command...',
  noMatch: 'No matching commands',
  category: {
    query: 'Query',
    view: 'View',
    editor: 'Editor',
    schema: 'Schema',
  },
  newQueryTab: 'New Query Tab',
  showExplorer: 'Show Explorer',
  showSchema: 'Show Schema',
  showPlugins: 'Show Plugins',
  runSelectedQuery: 'Run Selected Query',
  runEntireBuffer: 'Run Entire Buffer',
  toggleSecondarySidebar: 'View: Toggle Secondary Sidebar',
  toggleBottomDock: 'View: Toggle Bottom Dock',
  showInspector: 'View: Show Inspector',
  showNotifications: 'View: Show Notifications',
  openErDiagram: 'Open ER Diagram',
  /** "View: Show <panel title>" for plugin-contributed secondary panels. */
  viewShow: 'View: Show {title}',
} as const
