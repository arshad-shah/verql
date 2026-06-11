import {
  Gauge,
  Table2,
  PanelsTopLeft,
  Info,
  Sparkles,
  Wrench,
  ShieldCheck,
  Network,
  Palette,
  ToggleRight,
} from 'lucide-react'
import type { ReleaseNote } from './types'

/**
 * Curated "What's New" entries, **newest first**.
 *
 * This is hand-authored content, not auto-generated from the CHANGELOG: the
 * CHANGELOG is developer-facing (PRs, commit hashes, dialect detail) while these
 * speak to end users in plain language with a polished layout. Add a new object
 * to the TOP of this array when you cut a release you want users to see a page
 * for. Versions without an entry simply don't open a release tab on update.
 *
 * Authoring guide + structure: docs/onboarding.md ("Authoring release notes").
 * Keep `version` exactly equal to package.json's version so the running app
 * resolves it. Icons are any lucide-react component.
 */
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.1.0',
    date: '2026-06-11',
    headline: 'Smarter EXPLAIN, data browsing for every store, and an app-designed shell',
    summary:
      'This release pushes more database knowledge into the drivers themselves, adds one-click data browsing for non-SQL stores, and replaces the OS chrome with a shell we designed end to end.',
    groups: [
      {
        title: 'New features',
        tone: 'feature',
        highlights: [
          {
            id: 'driver-explain',
            icon: Gauge,
            title: 'Driver-declared EXPLAIN',
            description:
              'Each driver now carries its own explain statement, so query plans use the right syntax for Postgres, MySQL, SQLite and Snowflake — and the Explain action hides for stores that can’t plan, like Redis and MongoDB.',
          },
          {
            id: 'data-grid-browse',
            icon: Table2,
            title: 'Browse data in any store',
            description:
              'A new "View data" action opens a grid for non-SQL stores — keys and values for Redis, documents for MongoDB — using each driver’s own reader. No query required.',
          },
          {
            id: 'app-shell',
            icon: PanelsTopLeft,
            title: 'An app-designed shell',
            description:
              'On Windows and Linux the native menu bar is replaced with our own File / Edit / View / Query / Help menus and window controls, for a consistent look on every platform.',
          },
          {
            id: 'about-modal',
            icon: Info,
            title: 'A custom About window',
            description:
              'A branded "About Verql" panel with app and build versions, a copyable build block, and quick links — replacing the old "open the website" behaviour.',
          },
        ],
      },
      {
        title: 'Improvements',
        tone: 'improvement',
        highlights: [
          {
            id: 'diagnostics',
            icon: Network,
            title: 'Richer diagnostics',
            description:
              'The activity stream now captures IPC calls, plugin lifecycle, network requests and performance long-tasks, with a structured detail drawer and a session error summary for faster debugging.',
          },
          {
            id: 'design-system',
            icon: Palette,
            title: 'A more polished design system',
            description:
              'Size variants across more primitives, a redesigned Switch that reads identically across every theme, and a new gradient hero surface used by the About window.',
          },
          {
            id: 'connection-form',
            icon: Sparkles,
            title: 'Clearer connection form',
            description:
              'The new-connection form is reorganised into clear, grouped sections so the fields you need are easier to find.',
          },
        ],
      },
      {
        title: 'Fixes',
        tone: 'fix',
        highlights: [
          {
            id: 'live-layout-settings',
            icon: ToggleRight,
            title: 'Layout toggles apply instantly',
            description:
              'The "show secondary sidebar" and "show bottom dock" settings now take effect live instead of waiting for a restart.',
          },
          {
            id: 'mysql-explorer',
            icon: Wrench,
            title: 'Tidier MySQL explorer',
            description:
              'Server-internal databases are hidden and schemas no longer mis-nest, so the MySQL tree shows just your data.',
          },
          {
            id: 'headless-secrets',
            icon: ShieldCheck,
            title: 'No crash without OS encryption',
            description:
              'Verql no longer crashes when the operating system’s secret encryption is unavailable (for example on headless or WSL setups).',
          },
        ],
      },
    ],
    links: [
      { label: 'Full changelog', url: 'https://github.com/arshad-shah/verql/blob/main/CHANGELOG.md' },
      { label: 'User guide', url: 'https://verql.arshadshah.com/guide/' },
    ],
  },
]
