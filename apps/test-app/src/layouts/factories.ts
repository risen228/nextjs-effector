import { createGIPFactory, createGSPFactory } from 'nextjs-effector'
import { appStarted } from '../shared/events'

export const createGIP = createGIPFactory({
  sharedEvents: [appStarted],
})

export const createGSP = createGSPFactory()
