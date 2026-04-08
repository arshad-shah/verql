import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Flex, Text, Spinner, Badge, Tooltip, Box } from '@/primitives'
import { Database, AlertTriangle, CheckCircle, Zap, GitBranch } from 'lucide-react'

/**
 * The StatusBar sits at the bottom of the application window.
 * It provides at-a-glance information about connection state,
 * active schema, plugin health, and environment.
 *
 * ## Design Zones
 *
 * | Zone   | Content                                           |
 * |--------|---------------------------------------------------|
 * | Left   | Connection indicator, DB type, name, database, schema |
 * | Right  | Plugin status, tab count, encoding, dev badge     |
 *
 * ## Variants to consider
 * - Disconnected (no active connection)
 * - Connected with single DB
 * - Multiple connections active
 * - Plugin loading / failed / healthy
 * - Dev vs prod mode
 */

function StatusBarShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 1200 }}>
      {children}
    </div>
  )
}

const meta = {
  title: 'Shell/StatusBar',
  tags: ['autodocs'],
  decorators: [(Story: React.ComponentType) => <StatusBarShell><Story /></StatusBarShell>],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The default disconnected state — no active connection. */
export const Disconnected: Story = {
  render: () => (
    <Flex
      align="center"
      justify="between"
      className="h-6 bg-accent px-3 text-white shrink-0 select-none"
    >
      <Flex align="center" gap="md">
        <Flex align="center" gap="xs">
          <Box className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <Text size="xs" className="text-white/60">Disconnected</Text>
        </Flex>
      </Flex>
      <Flex align="center" gap="md">
        <Flex align="center" gap="xs" className="opacity-80">
          <CheckCircle size={10} />
          <Badge variant="success" size="sm">3 plugins</Badge>
        </Flex>
        <Text size="xs" className="text-white/60">1 tabs</Text>
        <Text size="xs" className="text-white/60">UTF-8</Text>
      </Flex>
    </Flex>
  ),
}

/** Connected to a PostgreSQL database with schema info. */
export const ConnectedPostgres: Story = {
  render: () => (
    <Flex
      align="center"
      justify="between"
      className="h-6 bg-accent px-3 text-white shrink-0 select-none"
    >
      <Flex align="center" gap="md">
        <Tooltip content="Connected to Production DB">
          <Flex align="center" gap="xs">
            <Box className="w-1.5 h-1.5 rounded-full bg-white" />
            <Database size={10} />
            <Text size="xs" className="text-white">PostgreSQL</Text>
            <Text size="xs" className="text-white/60">&middot;</Text>
            <Text size="xs" className="text-white">Production DB</Text>
            <Text size="xs" className="text-white/60">&middot;</Text>
            <Text size="xs" className="text-white/80">myapp_production</Text>
          </Flex>
        </Tooltip>
        <Text size="xs" className="text-white/40">|</Text>
        <Tooltip content="Active schema">
          <Flex align="center" gap="xs" className="opacity-70">
            <GitBranch size={9} />
            <Text size="xs" className="text-white">public</Text>
          </Flex>
        </Tooltip>
      </Flex>
      <Flex align="center" gap="md">
        <Flex align="center" gap="xs" className="opacity-80">
          <CheckCircle size={10} />
          <Badge variant="success" size="sm">5 plugins</Badge>
        </Flex>
        <Text size="xs" className="text-white/60">3 tabs</Text>
        <Text size="xs" className="text-white/60">UTF-8</Text>
      </Flex>
    </Flex>
  ),
}

/** Multiple active connections with count indicator. */
export const MultipleConnections: Story = {
  render: () => (
    <Flex
      align="center"
      justify="between"
      className="h-6 bg-accent px-3 text-white shrink-0 select-none"
    >
      <Flex align="center" gap="md">
        <Flex align="center" gap="xs">
          <Box className="w-1.5 h-1.5 rounded-full bg-white" />
          <Database size={10} />
          <Text size="xs" className="text-white">MySQL</Text>
          <Text size="xs" className="text-white/60">&middot;</Text>
          <Text size="xs" className="text-white">Staging</Text>
          <Text size="xs" className="text-white/60">&middot;</Text>
          <Text size="xs" className="text-white/80">orders_db</Text>
        </Flex>
        <Tooltip content="3 active connections">
          <Flex align="center" gap="xs" className="opacity-70">
            <Zap size={9} />
            <Text size="xs" className="text-white">3</Text>
          </Flex>
        </Tooltip>
      </Flex>
      <Flex align="center" gap="md">
        <Flex align="center" gap="xs" className="opacity-80">
          <CheckCircle size={10} />
          <Badge variant="success" size="sm">4 plugins</Badge>
        </Flex>
        <Text size="xs" className="text-white/60">5 tabs</Text>
        <Text size="xs" className="text-white/60">UTF-8</Text>
      </Flex>
    </Flex>
  ),
}

/** Plugins are still loading during boot. */
export const PluginsLoading: Story = {
  render: () => (
    <Flex
      align="center"
      justify="between"
      className="h-6 bg-accent px-3 text-white shrink-0 select-none"
    >
      <Flex align="center" gap="md">
        <Flex align="center" gap="xs">
          <Box className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <Text size="xs" className="text-white/60">Disconnected</Text>
        </Flex>
      </Flex>
      <Flex align="center" gap="md">
        <Flex align="center" gap="xs" className="opacity-80">
          <Spinner size="xs" label="Loading plugins" className="text-white" />
          <Text size="xs" className="text-white">Loading plugins...</Text>
        </Flex>
        <Text size="xs" className="text-white/60">0 tabs</Text>
        <Text size="xs" className="text-white/60">UTF-8</Text>
      </Flex>
    </Flex>
  ),
}

/** Some plugins failed to load. */
export const PluginsFailed: Story = {
  render: () => (
    <Flex
      align="center"
      justify="between"
      className="h-6 bg-accent px-3 text-white shrink-0 select-none"
    >
      <Flex align="center" gap="md">
        <Flex align="center" gap="xs">
          <Box className="w-1.5 h-1.5 rounded-full bg-white" />
          <Database size={10} />
          <Text size="xs" className="text-white">SQLite</Text>
          <Text size="xs" className="text-white/60">&middot;</Text>
          <Text size="xs" className="text-white">Local DB</Text>
          <Text size="xs" className="text-white/60">&middot;</Text>
          <Text size="xs" className="text-white/80">app.sqlite</Text>
        </Flex>
      </Flex>
      <Flex align="center" gap="md">
        <Tooltip content="2 plugin(s) failed to load">
          <Flex align="center" gap="xs">
            <AlertTriangle size={10} />
            <Badge variant="warning" size="sm">3/5 plugins</Badge>
          </Flex>
        </Tooltip>
        <Text size="xs" className="text-white/60">2 tabs</Text>
        <Text size="xs" className="text-white/60">UTF-8</Text>
      </Flex>
    </Flex>
  ),
}

/** Development mode indicator. */
export const DevMode: Story = {
  render: () => (
    <Flex
      align="center"
      justify="between"
      className="h-6 bg-accent px-3 text-white shrink-0 select-none"
    >
      <Flex align="center" gap="md">
        <Flex align="center" gap="xs">
          <Box className="w-1.5 h-1.5 rounded-full bg-white" />
          <Database size={10} />
          <Text size="xs" className="text-white">PostgreSQL</Text>
          <Text size="xs" className="text-white/60">&middot;</Text>
          <Text size="xs" className="text-white">Dev Server</Text>
          <Text size="xs" className="text-white/60">&middot;</Text>
          <Text size="xs" className="text-white/80">devdb</Text>
        </Flex>
      </Flex>
      <Flex align="center" gap="md">
        <Flex align="center" gap="xs" className="opacity-80">
          <CheckCircle size={10} />
          <Badge variant="success" size="sm">2 plugins</Badge>
        </Flex>
        <Text size="xs" className="text-white/60">1 tabs</Text>
        <Text size="xs" className="text-white/60">UTF-8</Text>
        <Badge variant="warning" size="sm" className="text-[9px] leading-none">DEV</Badge>
      </Flex>
    </Flex>
  ),
}
