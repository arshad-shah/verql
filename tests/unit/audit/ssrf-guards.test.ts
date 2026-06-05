// Security regression: two SSRF / DNS-rebinding guards.
//
// 1) The Ollama endpoint is a renderer-writable setting that the *main*
//    process fetch()es, so it must reject non-http(s) schemes, embedded
//    credentials, and link-local/metadata hosts (e.g. 169.254.169.254).
// 2) The MCP HTTP server binds loopback but must also reject non-loopback
//    Host headers, or a DNS-rebinding page can reach the local port.
import { describe, it, expect } from 'vitest'
import { assertSafeOllamaEndpoint } from '../../../src/main/plugins/bundled/ai/internal/providers/ollama'
import { isAllowedMcpHost } from '../../../src/main/mcp/auth'

describe('assertSafeOllamaEndpoint', () => {
  it('accepts ordinary http(s) endpoints', () => {
    expect(() => assertSafeOllamaEndpoint('http://localhost:11434')).not.toThrow()
    expect(() => assertSafeOllamaEndpoint('http://127.0.0.1:11434')).not.toThrow()
    expect(() => assertSafeOllamaEndpoint('https://ollama.example.com')).not.toThrow()
  })

  it('rejects the cloud-metadata / link-local hosts', () => {
    expect(() => assertSafeOllamaEndpoint('http://169.254.169.254')).toThrow()
    expect(() => assertSafeOllamaEndpoint('http://169.254.0.1/api')).toThrow()
    expect(() => assertSafeOllamaEndpoint('http://metadata.google.internal')).toThrow()
    expect(() => assertSafeOllamaEndpoint('http://0.0.0.0:11434')).toThrow()
  })

  it('rejects non-http schemes and embedded credentials', () => {
    expect(() => assertSafeOllamaEndpoint('file:///etc/passwd')).toThrow()
    expect(() => assertSafeOllamaEndpoint('ftp://host/x')).toThrow()
    expect(() => assertSafeOllamaEndpoint('http://user:pass@localhost:11434')).toThrow()
    expect(() => assertSafeOllamaEndpoint('not a url')).toThrow()
  })
})

describe('isAllowedMcpHost', () => {
  const PORT = 3100

  it('accepts loopback hosts with the bound port', () => {
    expect(isAllowedMcpHost('127.0.0.1:3100', PORT)).toBe(true)
    expect(isAllowedMcpHost('localhost:3100', PORT)).toBe(true)
    expect(isAllowedMcpHost('[::1]:3100', PORT)).toBe(true)
    expect(isAllowedMcpHost('localhost', PORT)).toBe(true) // no port
  })

  it('rejects non-loopback hosts (DNS-rebinding)', () => {
    expect(isAllowedMcpHost('evil.example.com:3100', PORT)).toBe(false)
    expect(isAllowedMcpHost('192.168.1.10:3100', PORT)).toBe(false)
    expect(isAllowedMcpHost(undefined, PORT)).toBe(false)
    expect(isAllowedMcpHost('', PORT)).toBe(false)
  })

  it('rejects a mismatched port on a loopback host', () => {
    expect(isAllowedMcpHost('127.0.0.1:9999', PORT)).toBe(false)
    expect(isAllowedMcpHost('[::1]:9999', PORT)).toBe(false)
  })
})
