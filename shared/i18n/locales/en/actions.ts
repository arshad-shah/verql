export const actions = {
  openSettings: {
    title: 'Open Settings',
    // The category list is appended dynamically at the call site, so this is the
    // static prose around it. {categories} = the comma-joined category ids,
    // {pluginsCategory} = the plugins category id.
    description:
      'Open the settings screen, optionally at a category ({categories}). Use category "{pluginsCategory}" to let the user enable or configure installed plugins.'
  },
  openConnections: {
    title: 'Open Connections',
    description:
      'Open the list of saved connections, where the user can connect to one that already exists. Use this when the user wants to connect to a database that is already saved (see the saved connections list).'
  },
  newConnection: {
    title: 'Add a Connection',
    description:
      'Open the form to create a brand-new connection. Only use this when the database the user wants is NOT already in the saved connections list; to connect to an existing one, use open-connections instead.'
  },
  openExplorer: {
    title: 'Open Explorer',
    description:
      'Show the explorer sidebar, where connections and schema live. Point users here to add or connect to a database.'
  },
  openSecondaryPanel: {
    title: 'Open Side Panel',
    description: 'Open a right-hand panel by id (e.g. connections, inspector, notifications).'
  },
  openNotifications: {
    title: 'Open Notifications',
    description:
      'Open the notifications panel, which lists recent errors, warnings, and activity. Use this when pointing the user to a past error or to recent diagnostics.'
  },
  newQueryTab: {
    title: 'Open Query Tab',
    description:
      'Open a new SQL query tab, optionally pre-filled with SQL. Use this to scaffold DDL such as CREATE TABLE, ALTER, or a migration script for the user to review. Nothing runs until the user executes it.'
  },
  openSavedQuery: {
    title: 'Open Saved Query',
    description:
      'Open a saved query in a new query tab, by its name or id. Nothing runs until the user executes it.'
  },
  formatEditor: {
    title: 'Format Document',
    description:
      "Pretty-print the active editor's buffer using the connection's formatter (SQL dialect, JSON for document stores, etc.). Reformats the whole buffer; runs nothing. No-ops when the connection has no formatter."
  },
  insertIntoEditor: {
    title: 'Insert into Editor',
    description:
      'Insert SQL into the active query editor, replacing the current selection (or inserting at the cursor when nothing is selected). The user reviews and runs it; nothing executes automatically.'
  },
  connectDatabase: {
    title: 'Connect to Database',
    description:
      'Open a connection to a saved database, by connection name or id. Use this to actually connect, not just navigate to the connections list.'
  },
  disconnectDatabase: {
    title: 'Disconnect Database',
    description:
      'Close the connection to a database, by name or id. Defaults to the active connection when none is given.'
  },
  switchConnection: {
    title: 'Switch Active Connection',
    description:
      'Make a saved connection the active one (connecting first if needed), by name or id. Subsequent queries and chat use this connection.'
  },
  exportResults: {
    title: 'Export Results',
    description:
      "Export the active query tab's current results to a file (csv or json). Opens a save dialog; data is written only to the file the user picks."
  },
  openChart: {
    title: 'Open Chart',
    description:
      'Open the chart panel for the active query result set. Needs at least two columns and one row.'
  },
  focusTable: {
    title: 'Reveal Table in Explorer',
    description:
      'Reveal a table (optionally a specific column) in the schema explorer for the active connection, expanding the tree and selecting it.'
  },
  openErDiagram: {
    title: 'Open ER Diagram',
    description:
      'Open the entity-relationship diagram for the active connection. Optionally pass a table to select it in the diagram.'
  },
  openInstallPlugin: {
    title: 'Install a Plugin',
    description:
      'Open the plugin install screen. To enable or configure already-installed plugins instead, use open-settings with category "plugins".'
  }
} as const
