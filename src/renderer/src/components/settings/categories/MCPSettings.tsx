import { useState, useEffect, useCallback } from 'react'
import { Stack, Divider, Flex, Button, Text } from '@/primitives'
import { Input } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'
import { PluginContributedSettings } from '../PluginContributedSettings'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { IPC_CHANNELS } from '@shared/ipc'

export function MCPSettings() {
  const mcp = useSettingsStore((s) => s.settings.mcp ?? { enabled: false, port: 3100, token: '' })
  const setSetting = useSettingsStore((s) => s.set)
  const [status, setStatus] = useState<{ running: boolean; port: number; clients: number; token: string }>({
    running: false, port: 3100, clients: 0, token: ''
  })
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const refreshStatus = useCallback(async () => {
    try {
      const s = await window.electronAPI.invoke(IPC_CHANNELS.MCP_STATUS) as { running: boolean; port: number; clients: number; token: string }
      setStatus(s)
    } catch { /* */ }
  }, [])

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 5000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  const handleToggle = async () => {
    setLoading(true)
    try {
      if (status.running) {
        await window.electronAPI.invoke(IPC_CHANNELS.MCP_STOP)
      } else {
        await window.electronAPI.invoke(IPC_CHANNELS.MCP_START)
      }
      await refreshStatus()
    } catch (err) {
      console.error('MCP toggle failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToken = () => {
    const token = status.token || mcp.token
    if (token) {
      navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyConfig = () => {
    const token = status.token || mcp.token
    const port = status.port || mcp.port
    const config = JSON.stringify({
      mcpServers: {
        verql: {
          type: 'sse',
          url: `http://localhost:${port}/sse`,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    }, null, 2)
    navigator.clipboard.writeText(config)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerateToken = async () => {
    // Clear existing token so server generates a new one
    await setSetting('mcp.token', '')
    if (status.running) {
      await window.electronAPI.invoke(IPC_CHANNELS.MCP_STOP)
      await window.electronAPI.invoke(IPC_CHANNELS.MCP_START)
      await refreshStatus()
    }
  }

  return (
    <Stack gap="md">
      <Text size="xs" color="muted">
        Expose your active database connection to external AI tools like Claude Code
      </Text>

      <SettingRow label="Server Status" description={
        status.running
          ? `Running on port ${status.port} · ${status.clients} client${status.clients !== 1 ? 's' : ''} connected`
          : 'Server is stopped'
      }>
        <Button
          variant={status.running ? 'outline' : 'solid'}
          size="sm"
          onClick={handleToggle}
          disabled={loading}
        >
          {loading ? 'Working...' : status.running ? 'Stop Server' : 'Start Server'}
        </Button>
      </SettingRow>

      <SettingRow label="Port" description="HTTP port for the MCP server">
        <Input
          type="number"
          value={mcp.port}
          onChange={(e) => setSetting('mcp.port', parseInt(e.target.value) || 3100)}
          size="sm"
          className="w-28"
          min={1024}
          max={65535}
          disabled={status.running}
          aria-label="MCP server port"
        />
      </SettingRow>

      <Divider />

      <SettingRow label="Auth Token" description="Bearer token for authenticating MCP clients">
        <Flex direction="row" align="center" gap="sm">
          <Input
            type="password"
            value={status.token || mcp.token || 'Start server to generate'}
            readOnly
            size="sm"
            className="w-56 font-mono"
            aria-label="MCP auth token"
          />
          <Button variant="ghost" size="sm" onClick={handleCopyToken} title="Copy token">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRegenerateToken} title="Regenerate token">
            <RefreshCw size={14} />
          </Button>
        </Flex>
      </SettingRow>

      <Divider />

      <SettingRow label="Claude Code Config" description="Copy this to ~/.claude.json to connect Claude Code">
        <Button variant="outline" size="sm" onClick={handleCopyConfig}>
          {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
          Copy Config
        </Button>
      </SettingRow>

      <div className="rounded-md bg-bg-primary border border-border p-3">
        <pre className="text-xs text-text-secondary font-mono whitespace-pre overflow-x-auto">
{JSON.stringify({
  mcpServers: {
    verql: {
      type: 'sse',
      url: `http://localhost:${status.port || mcp.port}/sse`,
      headers: {
        Authorization: `Bearer ${status.token || mcp.token || '<start server to generate>'}`
      }
    }
  }
}, null, 2)}
        </pre>
      </div>

      <PluginContributedSettings category="mcp" />
    </Stack>
  )
}
