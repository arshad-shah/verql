import { describe, it, expect } from 'vitest'
import { buildMcpClientConfig } from '../../../shared/mcp'

describe('buildMcpClientConfig', () => {
  it('builds the Claude SSE client config for a port + token', () => {
    const cfg = buildMcpClientConfig({ port: 3101, token: 'abc' })
    expect(cfg).toEqual({
      mcpServers: {
        verql: {
          type: 'sse',
          url: 'http://localhost:3101/sse',
          headers: { Authorization: 'Bearer abc' }
        }
      }
    })
  })
})
