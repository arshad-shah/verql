import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Flex, Text, Spinner } from '@/primitives'
import { Bell } from 'lucide-react'
import { StatusBarMetric } from './StatusBarMetric'
import { ConnectionCard } from './ConnectionCard'
import { cn } from '@/primitives/utils/cn'

/**
 * The Command Dock sits at the bottom of the application window.
 * Three-zone layout: connection card (left), contextual metrics (center), tools (right).
 *
 * ## Zones
 *
 * | Zone   | Content                                    |
 * |--------|--------------------------------------------|
 * | Left   | Connection card with status orb, DB type, name, schema |
 * | Center | Contextual metrics (query time, rows, running state) |
 * | Right  | Plugin status, notification bell, DEV badge |
 */

function DockShell({ children }: { children: React.ReactNode }) {
  return <div style={{ width: 1200 }}>{children}</div>
}

function DockWrapper({
  left,
  center,
  right,
}: {
  left: React.ReactNode
  center?: React.ReactNode
  right: React.ReactNode
}) {
  return (
    <Flex
      align="center"
      className="relative h-9.5 shrink-0 select-none border-t border-border-default bg-bg-primary px-3"
    >
      <Flex align="center" gap="xs" className="mr-auto">
        {left}
      </Flex>
      <Flex align="center" gap="xs">
        {center}
      </Flex>
      <Flex align="center" gap="xs" className="ml-auto">
        {right}
      </Flex>
    </Flex>
  )
}

function PluginCard({ active, total, loading }: { active: number; total: number; loading?: boolean }) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border-default bg-bg-tertiary px-2 py-1">
      {loading ? (
        <>
          <Spinner size="xs" label="Loading plugins" />
          <Text size="xs" color="secondary" className="text-[10px]">Loading...</Text>
        </>
      ) : (
        <>
          <div className={cn('h-1.5 w-1.5 rounded-full', active < total ? 'bg-warning' : 'bg-success')} />
          <Text size="xs" color="secondary" className="text-[10px]">
            {active < total ? `${active}/${total} plugins` : `${active} plugins`}
          </Text>
        </>
      )}
    </div>
  )
}

function BellCard({ count }: { count: number }) {
  return (
    <div className="relative flex items-center rounded-md border border-border-default bg-bg-tertiary px-2 py-1">
      <Bell size={12} className="text-text-secondary" />
      {count > 0 && (
        <div className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-error px-0.5 text-[7px] font-bold text-white">
          {count}
        </div>
      )}
    </div>
  )
}

function DevBadge() {
  return <div className="rounded-md bg-accent px-1.5 py-1 text-[9px] font-semibold text-white">DEV</div>
}

const meta = {
  title: 'Shell/StatusBar',
  tags: ['autodocs'],
  decorators: [(Story: React.ComponentType) => <DockShell><Story /></DockShell>],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** No active connection — disconnected state. */
export const Disconnected: Story = {
  render: () => (
    <DockWrapper
      left={
        <ConnectionCard isConnected={false} isError={false} dbType={null} dbName={null} schema={null} isOpen={false} onClick={() => {}} />
      }
      center={<Text size="xs" color="disabled">—</Text>}
      right={<><PluginCard active={3} total={3} /><BellCard count={0} /><DevBadge /></>}
    />
  ),
}

/** Connected to PostgreSQL with query results. */
export const ConnectedPostgres: Story = {
  render: () => (
    <DockWrapper
      left={
        <ConnectionCard isConnected isError={false} dbType="postgresql" dbName="my_app_db" schema="public" isOpen={false} onClick={() => {}} />
      }
      center={
        <>
          <StatusBarMetric color="success" label="⚡ 142ms" />
          <StatusBarMetric color="info" label="248 rows" />
        </>
      }
      right={<><PluginCard active={5} total={5} /><BellCard count={2} /><DevBadge /></>}
    />
  ),
}

/** Multiple active connections. */
export const MultipleConnections: Story = {
  render: () => (
    <DockWrapper
      left={
        <>
          <ConnectionCard isConnected isError={false} dbType="mysql" dbName="staging_mysql" schema={null} isOpen={false} onClick={() => {}} />
          <div className="flex items-center gap-1 rounded-[5px] border border-accent/15 bg-accent/8 px-1.5 py-0.5">
            <Text size="xs" color="accent" className="text-[10px]">↔ 3</Text>
          </div>
        </>
      }
      center={<StatusBarMetric color="success" label="⚡ 89ms" />}
      right={<><PluginCard active={4} total={4} /><BellCard count={0} /></>}
    />
  ),
}

/** Query currently running with elapsed time. */
export const QueryRunning: Story = {
  render: () => (
    <DockWrapper
      left={
        <ConnectionCard isConnected isError={false} dbType="postgresql" dbName="analytics_db" schema="reporting" isOpen={false} onClick={() => {}} />
      }
      center={<StatusBarMetric color="warning" label="Running..." animated />}
      right={<><PluginCard active={3} total={3} /><BellCard count={0} /><DevBadge /></>}
    />
  ),
}

/** Connection error state. */
export const ConnectionError: Story = {
  render: () => (
    <DockWrapper
      left={
        <ConnectionCard isConnected isError dbType="postgresql" dbName="prod_db" schema={null} isOpen={false} onClick={() => {}} />
      }
      center={<StatusBarMetric color="error" label="⚠ Reconnecting..." />}
      right={<><PluginCard active={3} total={3} /><BellCard count={3} /><DevBadge /></>}
    />
  ),
}

/** Plugins still loading during boot. */
export const PluginsLoading: Story = {
  render: () => (
    <DockWrapper
      left={
        <ConnectionCard isConnected={false} isError={false} dbType={null} dbName={null} schema={null} isOpen={false} onClick={() => {}} />
      }
      center={<Text size="xs" color="disabled">—</Text>}
      right={<><PluginCard active={0} total={0} loading /><BellCard count={0} /></>}
    />
  ),
}

/** Some plugins failed to load. */
export const PluginsFailed: Story = {
  render: () => (
    <DockWrapper
      left={
        <ConnectionCard isConnected isError={false} dbType="sqlite" dbName="local.db" schema={null} isOpen={false} onClick={() => {}} />
      }
      center={<StatusBarMetric color="success" label="⚡ 12ms" />}
      right={<><PluginCard active={3} total={5} /><BellCard count={1} /><DevBadge /></>}
    />
  ),
}
