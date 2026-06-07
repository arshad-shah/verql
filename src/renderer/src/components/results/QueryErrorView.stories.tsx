import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { QueryErrorView } from './QueryErrorView'
import { useDriverCapabilitiesStore } from '@/stores/driver-capabilities'

// QueryErrorView runs the raw driver text through parseDbError. Host-level
// patterns (auth, connection, timeout, …) classify with no driver registered,
// so most stories work standalone. The DriverClassified story seeds the
// driver-capabilities store so a query-semantic rule (owned by a driver
// plugin in the real app) matches — mirroring how the AI store is seeded in
// AutoCompactBanner.stories.
function seedDriverRules() {
  useDriverCapabilitiesStore.setState({
    byType: {
      postgresql: {
        errorRules: [{ code: 'SYNTAX_ERROR', pattern: 'syntax error at or near "(.+?)"' }],
      } as unknown as ReturnType<typeof useDriverCapabilitiesStore.getState>['byType'][string],
    },
  })
}

const meta: Meta<typeof QueryErrorView> = {
  title: 'Components/Results/QueryErrorView',
  component: QueryErrorView,
  decorators: [
    (Story) => (
      <div style={{ width: 720, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** Authentication failure — classified by a host pattern, with a hint + code chip. */
export const AuthFailed: Story = {
  args: {
    error: 'password authentication failed for user "verql"',
    dbType: 'postgresql',
  },
}

/** Server unreachable — the most common connection error. */
export const ConnectionRefused: Story = {
  args: {
    error: 'connect ECONNREFUSED 127.0.0.1:5432',
    dbType: 'postgresql',
  },
}

/** Statement exceeded its timeout. */
export const Timeout: Story = {
  args: {
    error: 'canceling statement due to statement timeout',
    dbType: 'postgresql',
  },
}

/** Driver-owned, query-semantic classification (needs the driver's errorRules). */
export const DriverClassified: Story = {
  decorators: [
    (Story) => {
      function Seeded() {
        useEffect(seedDriverRules, [])
        return <Story />
      }
      return <Seeded />
    },
  ],
  args: {
    error: 'syntax error at or near "SELCT"',
    dbType: 'postgresql',
  },
}

/** Unclassified error — falls through to UNKNOWN and renders the raw text cleanly. */
export const Unknown: Story = {
  args: {
    error: 'ERROR: deadlock detected while waiting for ShareLock on transaction 90231',
    dbType: 'postgresql',
  },
}

/** No dbType supplied (e.g. an app/network error surface reusing the view). */
export const NoDbType: Story = {
  args: {
    error: 'fetch failed: getaddrinfo ENOTFOUND api.example.com',
  },
}
