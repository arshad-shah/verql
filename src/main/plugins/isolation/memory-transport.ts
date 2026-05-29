// An in-memory transport pair: two linked `Transport`s that deliver each
// other's messages asynchronously (via queueMicrotask, to mimic the async
// nature of a real IPC channel and surface ordering bugs). Used by the unit
// tests to exercise the full host↔worker bridge with no subprocess.

import type { Transport } from './rpc'
import type { RpcMessage } from './protocol'

class MemoryTransport implements Transport {
  private peer?: MemoryTransport
  private messageHandler?: (m: RpcMessage) => void
  private closeHandler?: () => void
  private closed = false

  link(peer: MemoryTransport): void {
    this.peer = peer
  }

  post(message: RpcMessage): void {
    if (this.closed) return
    const peer = this.peer
    if (!peer) return
    // Clone to emulate the structured-clone boundary a real port imposes —
    // catches accidental passing of functions/class instances early.
    const cloned = structuredClone(message)
    queueMicrotask(() => peer.deliver(cloned))
  }

  private deliver(message: RpcMessage): void {
    if (this.closed) return
    this.messageHandler?.(message)
  }

  onMessage(handler: (m: RpcMessage) => void): void {
    this.messageHandler = handler
  }

  onClose(handler: () => void): void {
    this.closeHandler = handler
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    const peer = this.peer
    queueMicrotask(() => peer?.notifyClosed())
  }

  private notifyClosed(): void {
    if (this.closed) return
    this.closed = true
    this.closeHandler?.()
  }
}

/** Create two linked transports — one for the host, one for the worker. */
export function createMemoryTransportPair(): { host: Transport; worker: Transport } {
  const host = new MemoryTransport()
  const worker = new MemoryTransport()
  host.link(worker)
  worker.link(host)
  return { host, worker }
}
