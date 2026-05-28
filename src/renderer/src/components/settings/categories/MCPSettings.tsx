import { useState, useEffect, useCallback } from 'react'
import { Stack, Divider, Flex, Button, Text, Input, CodeView, Switch } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'
import { PluginContributedSettings } from '../PluginContributedSettings'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { IPC_CHANNELS, IPC_EVENTS } from '@shared/ipc'
import { buildMcpClientConfig, type MCPServerStatus, type MCPToolInfo, type MCPActivityEntry } from '@shared/mcp'

const DEFAULT_STATUS: MCPServerStatus = { running: false, port: 3100, clients: 0, token: '', autoSelectedPort: false }

export function MCPSettings() {
  const mcp = useSettingsStore((s) => s.settings.mcp)
  const setSetting = useSettingsStore((s) => s.set)
  const [status, setStatus] = useState<MCPServerStatus>(DEFAULT_STATUS)
  const [tools, setTools] = useState<MCPToolInfo[]>([])
  const [activity, setActivity] = useState<MCPActivityEntry[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setStatus(await window.electronAPI.invoke(IPC_CHANNELS.MCP_STATUS) as MCPServerStatus)
      setTools(await window.electronAPI.invoke(IPC_CHANNELS.MCP_TOOLS) as MCPToolInfo[])
      setActivity(await window.electronAPI.invoke(IPC_CHANNELS.MCP_ACTIVITY) as MCPActivityEntry[])
    } catch { /* */ }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    const off = window.electronAPI.on(IPC_EVENTS.MCP_ACTIVITY_EVENT, (entry: unknown) => {
      setActivity(prev => [...prev.slice(-99), entry as MCPActivityEntry])
    })
    return () => { clearInterval(interval); off() }
  }, [refresh])

  const toggleServer = async () => {
    setLoading(true); setError(null)
    try {
      if (status.running) await window.electronAPI.invoke(IPC_CHANNELS.MCP_STOP)
      else await window.electronAPI.invoke(IPC_CHANNELS.MCP_START)
      await refresh()
    } catch (err) {
      // Electron IPC strips custom error props (code/port), so detect the
      // port conflict from the message text the main process throws
      // ("Port N is already in use") rather than an error code.
      const msg = (err as { message?: string }).message ?? ''
      setError(/EADDRINUSE|already in use/i.test(msg)
        ? `Port ${mcp.port} is already in use. Enable auto-port or pick another.`
        : (msg || 'Failed to start MCP server'))
    } finally { setLoading(false) }
  }

  const token = status.token || mcp.token
  const port = status.running ? status.port : mcp.port
  const configJson = JSON.stringify(buildMcpClientConfig({ port, token: token || '<start server to generate>' }), null, 2)

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(buildMcpClientConfig({ port, token }), null, 2))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const regenerate = async () => {
    setStatus(await window.electronAPI.invoke(IPC_CHANNELS.MCP_REGENERATE_TOKEN) as MCPServerStatus)
    await refresh()
  }

  const setReadOnly = async (v: boolean) => {
    await setSetting('mcp.readOnly', v)
    if (status.running) { await window.electronAPI.invoke(IPC_CHANNELS.MCP_RELOAD); await refresh() }
  }

  const setToolEnabled = async (id: string, enabled: boolean) => {
    setTools(prev => prev.map(t => t.id === id ? { ...t, enabled } : t))
    await window.electronAPI.invoke(IPC_CHANNELS.MCP_SET_TOOL_ENABLED, id, enabled)
    await refresh()
  }

  return (
    <Stack gap="md">
      <Text size="xs" color="muted">Expose your active database connection to external AI tools like Claude Code</Text>

      <SettingRow label="Server Status" description={
        status.running ? `Running on port ${status.port} · ${status.clients} client${status.clients !== 1 ? 's' : ''} connected` : 'Server is stopped'
      }>
        <Button variant={status.running ? 'outline' : 'solid'} size="sm" onClick={toggleServer} disabled={loading}>
          {loading ? 'Working...' : status.running ? 'Stop Server' : 'Start Server'}
        </Button>
      </SettingRow>

      {status.running && status.autoSelectedPort && (
        <Text size="xs" color="muted">Requested port {mcp.port} was busy — using {status.port}.</Text>
      )}
      {error && <Text size="xs" color="error">{error}</Text>}

      <SettingRow label="Port" description="Preferred HTTP port for the MCP server">
        <Input type="number" value={mcp.port} onChange={(e) => setSetting('mcp.port', parseInt(e.target.value) || 3100)} size="sm" className="w-28" min={1024} max={65535} disabled={status.running} aria-label="MCP server port" />
      </SettingRow>

      <SettingRow label="Auto-resolve port" description="If the preferred port is busy, bind the next free port">
        <Switch checked={mcp.autoPort} onChange={(e) => setSetting('mcp.autoPort', e.target.checked)} disabled={status.running} label="Auto-resolve port" />
      </SettingRow>

      <SettingRow label="Read-only mode" description="Hide write tools from MCP clients entirely">
        <Switch checked={mcp.readOnly} onChange={(e) => setReadOnly(e.target.checked)} label="Read-only mode" />
      </SettingRow>

      <SettingRow label="Max rows" description="Row cap returned by the query tool">
        <Input type="number" value={mcp.maxRows} onChange={(e) => setSetting('mcp.maxRows', parseInt(e.target.value) || 500)} size="sm" className="w-28" min={1} max={100000} aria-label="Max rows" />
      </SettingRow>

      <Divider />
      <Text size="sm" color="muted">Tools exposed to MCP clients</Text>
      <Stack gap="xs">
        {tools.map(t => (
          <>
            <Flex key={t.id} direction="row" align="center" justify="between" gap="sm">
              <Stack gap="sm">
                <Text size="xs">{t.name} <Text as="span" size="xs" color="muted">({t.permission})</Text></Text>
                <Text size="xs" color="muted">{t.description}</Text>
              </Stack>
              <Switch checked={t.enabled} onChange={(e) => setToolEnabled(t.id, e.target.checked)} label={`Enable ${t.name}`} />
            </Flex>


            <SettingRow key={t.id} label={t.name} description={t.description}>
              <Switch checked={t.enabled} onChange={(e) => setToolEnabled(t.id, e.target.checked)} label={`Enable ${t.name}`} />
            </SettingRow>
          </>
        ))}
      </Stack>

      <Divider />
      <SettingRow label="Auth Token" description="Bearer token for authenticating MCP clients">
        <Flex direction="row" align="center" gap="sm">
          <Input type="password" value={token || 'Start server to generate'} readOnly size="sm" className="w-56 font-mono" aria-label="MCP auth token" />
          <Button variant="ghost" size="sm" onClick={regenerate} title="Regenerate token"><RefreshCw size={14} /></Button>
        </Flex>
      </SettingRow>

      <SettingRow label="Claude Code Config" description="Copy this to ~/.claude.json to connect Claude Code">
        <Button variant="outline" size="sm" onClick={copyConfig}>
          {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />} Copy Config
        </Button>
      </SettingRow>
      <CodeView code={configJson} language="json" />

      <Divider />
      <Text size="xs" color="muted">Recent activity</Text>
      <Stack gap="xs">
        {activity.length === 0 && <Text size="xs" color="muted">No MCP tool calls yet.</Text>}
        {[...activity].reverse().map(a => (
          <Flex key={a.id} direction="row" align="center" gap="sm">
            <Text as="span" size="xs" color={a.status === 'ok' ? 'success' : a.status === 'rejected' ? 'warning' : 'error'}>●</Text>
            <Text size="xs" className="font-mono">{a.toolId}</Text>
            <Text size="xs" color="muted" truncate>{a.paramsSummary}</Text>
            <Text size="xs" color="muted">{a.durationMs}ms</Text>
          </Flex>
        ))}
      </Stack>

      <PluginContributedSettings category="mcp" />
    </Stack>
  )
}
