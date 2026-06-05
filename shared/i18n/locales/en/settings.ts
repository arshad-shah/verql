export const settings = {
  general: {
    blurb: 'Basic application settings',
    queryTimeout: {
      label: 'Query Timeout',
      description: 'Maximum time in seconds before a query is cancelled',
    },
    maxHistoryItems: {
      label: 'Max History Items',
      description: 'Number of recent queries to keep in history',
    },
    defaultPageSize: {
      label: 'Default Page Size',
      description: 'Number of rows to fetch per page when browsing tables',
    },
    confirmDestructive: {
      label: 'Confirm destructive queries',
      description:
        'Show a confirmation dialog before running DELETE, DROP, TRUNCATE, or UPDATE without WHERE',
    },
    confirmUnsavedClose: {
      label: 'Confirm on unsaved close',
      description: 'Ask before closing a tab that has unsaved changes',
    },
    restoreTabs: {
      label: 'Restore tabs on startup',
      description: 'Re-open the tabs that were active when the app last quit',
    },
  },
} as const
