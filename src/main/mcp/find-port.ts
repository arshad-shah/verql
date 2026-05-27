import { createServer } from 'http'

function isFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const srv = createServer()
    srv.once('error', () => resolve(false))
    srv.listen(port, '127.0.0.1', () => srv.close(() => resolve(true)))
  })
}

/** Probe `start … start+span-1` for the first free port on 127.0.0.1. */
export async function findFreePort(start: number, span: number): Promise<number> {
  for (let port = start; port < start + span; port++) {
    if (await isFree(port)) return port
  }
  throw new Error(`No free port in range ${start}-${start + span - 1}`)
}
