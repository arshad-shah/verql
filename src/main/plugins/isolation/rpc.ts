// Transport-agnostic bidirectional RPC.
//
// `RpcEndpoint` sits on either side of a duplex `Transport`. Both sides can
// issue requests and register handlers, so the host and worker use the exact
// same class. Keeping this independent of Electron lets the whole isolation
// bridge be unit-tested over an in-memory transport (see memory-transport.ts)
// with no subprocess at all.

import {
  type RpcMessage,
  type SerializedError,
  serializeError,
  deserializeError,
} from './protocol'

/** The minimal duplex channel the RPC layer needs. A real implementation wraps
 *  an Electron `utilityProcess` MessagePort; the test implementation wires two
 *  endpoints in memory. */
export interface Transport {
  post(message: RpcMessage): void
  onMessage(handler: (message: RpcMessage) => void): void
  /** Notify the endpoint that the channel is gone (process exited). */
  onClose(handler: () => void): void
  close(): void
}

export type RpcHandler = (params: unknown) => unknown | Promise<unknown>
export type EventHandler = (params: unknown) => void

const DEFAULT_TIMEOUT_MS = 30_000

export class RpcEndpoint {
  private nextId = 1
  private pending = new Map<
    number,
    { resolve: (v: unknown) => void; reject: (e: Error) => void; timer?: ReturnType<typeof setTimeout> }
  >()
  private handlers = new Map<string, RpcHandler>()
  private eventHandlers = new Map<string, EventHandler>()
  private closeCallbacks: Array<() => void> = []
  private closed = false

  constructor(
    private readonly transport: Transport,
    private readonly options: { timeoutMs?: number } = {},
  ) {
    transport.onMessage((msg) => this.dispatch(msg))
    transport.onClose(() => this.handleClose())
  }

  /** Register a request handler for `method`. Returns this for chaining. */
  handle(method: string, handler: RpcHandler): this {
    this.handlers.set(method, handler)
    return this
  }

  /** Register a fire-and-forget event handler. */
  on(method: string, handler: EventHandler): this {
    this.eventHandlers.set(method, handler)
    return this
  }

  /** Run `cb` when the channel closes (transport closed or peer gone). The
   *  endpoint owns the transport's single close handler and fans out here, so
   *  multiple consumers (e.g. IsolatedPlugin) can observe close. */
  onClose(cb: () => void): this {
    if (this.closed) {
      cb()
    } else {
      this.closeCallbacks.push(cb)
    }
    return this
  }

  /** Issue a request and await its response. */
  request<T = unknown>(method: string, params: unknown): Promise<T> {
    if (this.closed) return Promise.reject(new Error('RPC endpoint is closed'))
    const id = this.nextId++
    const timeoutMs = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    return new Promise<T>((resolve, reject) => {
      const timer =
        timeoutMs > 0
          ? setTimeout(() => {
              this.pending.delete(id)
              reject(new Error(`RPC '${method}' timed out after ${timeoutMs}ms`))
            }, timeoutMs)
          : undefined
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer })
      this.transport.post({ kind: 'req', id, method, params })
    })
  }

  /** Send a fire-and-forget event. */
  emit(method: string, params: unknown): void {
    if (this.closed) return
    this.transport.post({ kind: 'evt', method, params })
  }

  close(): void {
    this.handleClose()
    this.transport.close()
  }

  private handleClose(): void {
    if (this.closed) return
    this.closed = true
    for (const { reject, timer } of this.pending.values()) {
      if (timer) clearTimeout(timer)
      reject(new Error('RPC channel closed before response'))
    }
    this.pending.clear()
    for (const cb of this.closeCallbacks.splice(0)) {
      try {
        cb()
      } catch {
        /* ignore */
      }
    }
  }

  private dispatch(msg: RpcMessage): void {
    switch (msg.kind) {
      case 'req':
        void this.handleRequest(msg.id, msg.method, msg.params)
        return
      case 'res':
        this.handleResponse(msg.id, msg)
        return
      case 'evt': {
        const h = this.eventHandlers.get(msg.method)
        if (h) {
          try {
            h(msg.params)
          } catch {
            // Event handlers are best-effort; never crash the endpoint.
          }
        }
        return
      }
    }
  }

  private async handleRequest(id: number, method: string, params: unknown): Promise<void> {
    const handler = this.handlers.get(method)
    if (!handler) {
      this.transport.post({
        kind: 'res',
        id,
        ok: false,
        error: { name: 'Error', message: `No handler for RPC method '${method}'` },
      })
      return
    }
    try {
      const result = await handler(params)
      this.transport.post({ kind: 'res', id, ok: true, result })
    } catch (err) {
      this.transport.post({ kind: 'res', id, ok: false, error: serializeError(err) })
    }
  }

  private handleResponse(id: number, msg: Extract<RpcMessage, { kind: 'res' }>): void {
    const entry = this.pending.get(id)
    if (!entry) return
    this.pending.delete(id)
    if (entry.timer) clearTimeout(entry.timer)
    if (msg.ok) entry.resolve(msg.result)
    else entry.reject(deserializeError(msg.error as SerializedError))
  }
}
