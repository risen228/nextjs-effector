import { createAppGSSP } from '@app/shared/lib/effector'
import { appStarted } from './model'

export const createGSSP = createAppGSSP({
  globalEvents: [appStarted],
})
