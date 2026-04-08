// src/main/plugins/bundled/ssh-tunnel/index.ts
import { Client } from 'ssh2'
import net from 'net'
import type { PluginContext, ConnectionMiddleware } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import type { ConnectionProfile } from '@shared/types'

const activeTunnels = new Map<string, Client>()

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-ssh',
  version: '1.0.0',
  displayName: 'SSH Tunnels',
  description: 'SSH tunnel support for database connections',
  main: 'index.js',
  contributes: {
    connectionMiddleware: [{ id: 'ssh-tunnel' }],
    connectionFields: [
      { key: 'sshHost', label: 'SSH Host', type: 'text', group: 'ssh' },
      { key: 'sshPort', label: 'SSH Port', type: 'number', default: 22, group: 'ssh' },
      { key: 'sshUser', label: 'SSH User', type: 'text', group: 'ssh' },
      { key: 'sshPassword', label: 'SSH Password', type: 'password', group: 'ssh' },
      { key: 'sshPrivateKey', label: 'Private Key', type: 'file', group: 'ssh' }
    ]
  }
}

export const sshMiddleware: ConnectionMiddleware = {
  shouldApply(profile: ConnectionProfile): boolean {
    return !!(profile as Record<string, unknown>).sshHost
  },

  async beforeConnect(profile: ConnectionProfile): Promise<ConnectionProfile> {
    const p = profile as Record<string, unknown>
    const sshHost = p.sshHost as string
    const sshPort = (p.sshPort as number) || 22
    const sshUser = (p.sshUser as string) || 'root'
    const sshPassword = p.sshPassword as string | undefined
    const sshPrivateKey = p.sshPrivateKey as string | undefined

    const remoteHost = profile.host || 'localhost'
    const remotePort = profile.port || 5432

    const localPort = await getAvailablePort()

    return new Promise<ConnectionProfile>((resolve, reject) => {
      const client = new Client()

      client.on('ready', () => {
        client.forwardOut('127.0.0.1', localPort, remoteHost, remotePort, (err, stream) => {
          if (err) {
            client.end()
            reject(new Error(`Failed to establish SSH tunnel: ${err.message}`))
            return
          }

          const server = net.createServer((sock) => {
            stream.pipe(sock)
            sock.pipe(stream)
          })

          server.listen(localPort, '127.0.0.1', () => {
            activeTunnels.set(profile.id, client)
            resolve({ ...profile, host: '127.0.0.1', port: localPort })
          })

          server.on('error', (serverErr) => {
            client.end()
            reject(new Error(`Failed to establish SSH tunnel: ${serverErr.message}`))
          })

          ;(client as any)._tunnelServer = server
        })
      })

      client.on('error', (err) => {
        if (err.message.includes('authentication') || err.message.includes('Auth')) {
          reject(new Error('SSH authentication failed — check credentials or private key'))
        } else if (err.message.includes('ECONNREFUSED')) {
          reject(new Error(`Cannot reach SSH host ${sshHost}:${sshPort}`))
        } else {
          reject(new Error(`Failed to establish SSH tunnel: ${err.message}`))
        }
      })

      const connectConfig: any = { host: sshHost, port: sshPort, username: sshUser }
      if (sshPrivateKey) {
        connectConfig.privateKey = sshPrivateKey
      } else if (sshPassword) {
        connectConfig.password = sshPassword
      }

      client.connect(connectConfig)
    })
  },

  async onDisconnect(profileId: string): Promise<void> {
    const client = activeTunnels.get(profileId)
    if (client) {
      const server = (client as any)._tunnelServer as net.Server | undefined
      if (server) server.close()
      client.end()
      activeTunnels.delete(profileId)
    }
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.registerConnectionMiddleware('ssh-tunnel', sshMiddleware)
}

export function deactivate(): void {
  for (const [, client] of activeTunnels) {
    const server = (client as any)._tunnelServer as net.Server | undefined
    if (server) server.close()
    client.end()
  }
  activeTunnels.clear()
}

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as net.AddressInfo
      server.close(() => resolve(addr.port))
    })
    server.on('error', reject)
  })
}
