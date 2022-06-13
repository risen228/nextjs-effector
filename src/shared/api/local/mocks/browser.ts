import { setupWorker } from 'msw'
import { handlers } from './handlers'

export const createWorker = () => setupWorker(...handlers)
