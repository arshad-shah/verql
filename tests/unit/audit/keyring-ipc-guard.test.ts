// Security regression: the generic keyring IPC channels must not be a
// bypass of the secret-redaction model.
//
// `connections:list/save` redact connection passwords and `settings:get`
// redacts AI keys before they reach the renderer. But `keyring:retrieve`
// read the same underlying store with a fully renderer-controlled
// (profileId, key) pair — so a compromised renderer could exfiltrate:
//   - keyring:retrieve('__ai__', 'openai')   → raw OpenAI key
//   - keyring:retrieve('__ai__', 'anthropic')→ raw Anthropic key
//   - keyring:retrieve(<profileId>, 'password') → any DB password
// defeating every redaction elsewhere.
//
// The guard restricts these channels to recognised connection-secret
// fields on existing profiles, and refuses the reserved AI namespace.
import { describe, it, expect } from 'vitest'
import { assertKeyringAccess } from '../../../src/main/ipc/keyring'
import type { IpcContext } from '../../../src/main/ipc/context'

function makeCtx(
  profileIds: string[],
  fields: Array<{ key: string; type: string }> = [],
): IpcContext {
  return {
    configStore: {
      getConnection: (id: string) =>
        profileIds.includes(id) ? ({ id } as never) : undefined,
    },
    driverRegistry: {
      getDriverIds: () => ['postgresql'],
      get: () => ({ connectionFields: fields }),
    },
  } as unknown as IpcContext
}

describe('keyring IPC access guard', () => {
  it('rejects the reserved __ai__ namespace (AI key exfiltration)', () => {
    const ctx = makeCtx([])
    expect(() => assertKeyringAccess(ctx, '__ai__', 'openai')).toThrow()
    expect(() => assertKeyringAccess(ctx, '__ai__', 'anthropic')).toThrow()
  })

  it('rejects keys that are not connection secret fields', () => {
    const ctx = makeCtx(['p1'])
    expect(() => assertKeyringAccess(ctx, 'p1', 'name')).toThrow()
    expect(() => assertKeyringAccess(ctx, 'p1', 'host')).toThrow()
  })

  it('rejects unknown profile ids (namespace enumeration)', () => {
    const ctx = makeCtx(['p1'])
    expect(() => assertKeyringAccess(ctx, 'does-not-exist', 'password')).toThrow()
  })

  it('allows the canonical password field for an existing profile', () => {
    const ctx = makeCtx(['p1'])
    expect(() => assertKeyringAccess(ctx, 'p1', 'password')).not.toThrow()
  })

  it('allows a plugin-declared password-typed field', () => {
    const ctx = makeCtx(['p1'], [{ key: 'sshPassphrase', type: 'password' }])
    expect(() => assertKeyringAccess(ctx, 'p1', 'sshPassphrase')).not.toThrow()
  })
})
