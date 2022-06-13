import { createWorker } from './browser'
import { createServer } from './server'

export async function setup() {
  if (typeof window === 'undefined') {
    const server = createServer()
    server.listen()
    return server.close
  }

  const worker = createWorker()
  await worker.start()
  return worker.stop
}
