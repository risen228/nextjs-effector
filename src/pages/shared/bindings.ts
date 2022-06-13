import { createGIPFactory, createGSPFactory } from '@app/shared/lib/effector'
import { appStarted } from './model'

export const createGIP = createGIPFactory({
  sharedEvents: [appStarted],
})

export const createGSP = createGSPFactory()
