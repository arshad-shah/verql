// Authored "What's New" release-notes content. This is the user-facing copy for
// each curated release; the registry (src/renderer/src/lib/release-notes/) holds
// only the structure (version, date, icons, ids, tones) and references these
// keys. Like all user-facing strings, release-notes prose lives on the i18n
// surface — never inlined in the registry or components.
//
// Convention: shared group headings + link labels at the top, then one block per
// version keyed `v<major>_<minor>_<patch>`. Each highlight is `{ title, description }`.
export const whatsNew = {
  groups: {
    features: 'New features',
    improvements: 'Improvements',
    fixes: 'Fixes',
  },
  links: {
    changelog: 'Full changelog',
    sdkDocs: 'Plugin SDK docs',
    userGuide: 'User guide',
  },
  v1_2_0: {
    headline: 'Plugins go public on npm, and a warmer first run',
    summary:
      'The plugin SDK is now on npm, so anyone can build and share Verql plugins. First-time users get a guided welcome, and in-app release notes mean you’ll always know what changed in an update.',
    sdkOnNpm: {
      title: 'Plugin SDK published to npm',
      description:
        'Build Verql plugins against @verql/plugin-sdk, now available on npm. Install it with "npm install @verql/plugin-sdk" and code against the same typed, Electron-free surface the bundled drivers use — then ship your own drivers, exporters, themes, AI providers and tools.',
    },
    welcome: {
      title: 'A guided first run',
      description:
        'New installs open a Welcome tab with quick actions and a Get Started checklist that tracks your progress — connect a database, run a query, set up the AI assistant, and more.',
    },
    releaseNotes: {
      title: 'Release notes, in the app',
      description:
        'After an update, Verql opens a “What’s New” page (like this one) so new features don’t go unnoticed. Reach it any time from Help → What’s New.',
    },
    nouns: {
      title: 'Speaks your database’s language',
      description:
        'The explorer and menus now use each driver’s own terms — objects, fields and records where “tables, columns and rows” don’t fit — so document and key/value stores read naturally instead of being forced into SQL wording.',
    },
  },
  v1_1_0: {
    headline: 'Smarter EXPLAIN, data browsing for every store, and an app-designed shell',
    summary:
      'This release pushes more database knowledge into the drivers themselves, adds one-click data browsing for non-SQL stores, and replaces the OS chrome with a shell we designed end to end.',
    explain: {
      title: 'Driver-declared EXPLAIN',
      description:
        'Each driver now carries its own explain statement, so query plans use the right syntax for Postgres, MySQL, SQLite and Snowflake — and the Explain action hides for stores that can’t plan, like Redis and MongoDB.',
    },
    browse: {
      title: 'Browse data in any store',
      description:
        'A new "View data" action opens a grid for non-SQL stores — keys and values for Redis, documents for MongoDB — using each driver’s own reader. No query required.',
    },
    shell: {
      title: 'An app-designed shell',
      description:
        'On Windows and Linux the native menu bar is replaced with our own File / Edit / View / Query / Help menus and window controls, for a consistent look on every platform.',
    },
    about: {
      title: 'A custom About window',
      description:
        'A branded "About Verql" panel with app and build versions, a copyable build block, and quick links — replacing the old "open the website" behaviour.',
    },
    diagnostics: {
      title: 'Richer diagnostics',
      description:
        'The activity stream now captures IPC calls, plugin lifecycle, network requests and performance long-tasks, with a structured detail drawer and a session error summary for faster debugging.',
    },
    design: {
      title: 'A more polished design system',
      description:
        'Size variants across more primitives, a redesigned Switch that reads identically across every theme, and a new gradient hero surface used by the About window.',
    },
    connForm: {
      title: 'Clearer connection form',
      description:
        'The new-connection form is reorganised into clear, grouped sections so the fields you need are easier to find.',
    },
    liveLayout: {
      title: 'Layout toggles apply instantly',
      description:
        'The "show secondary sidebar" and "show bottom dock" settings now take effect live instead of waiting for a restart.',
    },
    mysql: {
      title: 'Tidier MySQL explorer',
      description:
        'Server-internal databases are hidden and schemas no longer mis-nest, so the MySQL tree shows just your data.',
    },
    headlessSecrets: {
      title: 'No crash without OS encryption',
      description:
        'Verql no longer crashes when the operating system’s secret encryption is unavailable (for example on headless or WSL setups).',
    },
  },
} as const
