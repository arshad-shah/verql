// Entry point that runs INSIDE the Electron utilityProcess. It bridges
// `process.parentPort` (Electron's MessagePortMain) to a `Transport` and starts
// the worker runtime. This file is bundled to out/main/plugin-worker.js (see
// electron.vite.config.ts) and forked by worker-process.ts.

import type { Transport } from './rpc'
import type { RpcMessage } from './protocol'
import { startWorker } from './worker-runtime'

interface ParentPort {
  postMessage(message: unknown): void
  on(event: 'message', listener: (e: { data: unknown }) => void): void
  start?(): void
}

function parentPortTransport(): Transport {
  const parentPort = (process as unknown as { parentPort?: ParentPort }).parentPort
  if (!parentPort) {
    throw new Error('plugin-worker must run inside an Electron utilityProcess (no parentPort)')
  }
  let messageHandler: ((m: RpcMessage) => void) | undefined

  parentPort.on('message', (e) => {
    messageHandler?.(e.data as RpcMessage)
  })
  parentPort.start?.()

  return {
    post: (message) => parentPort.postMessage(message),
    onMessage: (handler) => {
      messageHandler = handler
    },
    // The host owns lifecycle; the worker simply exits when killed.
    onClose: () => {},
    close: () => {
      process.exit(0)
    },
  }
}

startWorker(parentPortTransport())
