// Host-side: spawn an Electron utilityProcess for an isolated plugin and adapt
// it to the `Transport` interface the RPC layer expects. utilityProcess gives
// us a real OS process with its own V8 isolate — a crashing or hostile plugin
// can't take down the main process, and (combined with the capability gating)
// can only reach Verql through the host.

import { utilityProcess, type UtilityProcess } from 'electron'
import path from 'path'
import type { Transport } from './rpc'
import type { RpcMessage } from './protocol'

class UtilityProcessTransport implements Transport {
  private messageHandler?: (m: RpcMessage) => void
  private closeHandler?: () => void
  private dead = false

  constructor(private readonly child: UtilityProcess) {
    child.on('message', (msg: RpcMessage) => this.messageHandler?.(msg))
    child.on('exit', () => this.markDead())
  }

  post(message: RpcMessage): void {
    if (this.dead) return
    this.child.postMessage(message)
  }

  onMessage(handler: (m: RpcMessage) => void): void {
    this.messageHandler = handler
  }

  onClose(handler: () => void): void {
    this.closeHandler = handler
  }

  close(): void {
    if (this.dead) return
    this.child.kill()
    this.markDead()
  }

  private markDead(): void {
    if (this.dead) return
    this.dead = true
    this.closeHandler?.()
  }
}

/** The compiled worker entry lives next to the main bundle (out/main/). */
export function workerScriptPath(): string {
  return path.join(__dirname, 'plugin-worker.js')
}

export function spawnIsolatedWorker(scriptPath = workerScriptPath()): Transport {
  // No env, no extra args — the worker gets the bare minimum. (Stricter
  // sandboxing — e.g. dropping NODE_OPTIONS — can be layered on here later.)
  const child = utilityProcess.fork(scriptPath, [], {
    serviceName: 'verql-plugin-worker',
    env: { ...process.env },
  })
  return new UtilityProcessTransport(child)
}
