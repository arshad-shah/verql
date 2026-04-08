import { describe, it, expect } from 'vitest'
import { sshMiddleware } from '../../src/main/plugins/bundled/ssh-tunnel/index'

describe('SSH Tunnel Middleware', () => {
  describe('shouldApply', () => {
    it('returns true when sshHost is set', () => {
      const profile = { id: '1', name: 'Test', type: 'postgresql', database: 'db', sshHost: 'bastion.example.com' } as any
      expect(sshMiddleware.shouldApply(profile)).toBe(true)
    })

    it('returns false when sshHost is not set', () => {
      const profile = { id: '1', name: 'Test', type: 'postgresql', database: 'db' } as any
      expect(sshMiddleware.shouldApply(profile)).toBe(false)
    })

    it('returns false when sshHost is empty string', () => {
      const profile = { id: '1', name: 'Test', type: 'postgresql', database: 'db', sshHost: '' } as any
      expect(sshMiddleware.shouldApply(profile)).toBe(false)
    })
  })
})
