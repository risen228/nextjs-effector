import {
  createGipFactory,
  createGspFactory,
} from '@app/shared/lib/effector'
import { appStarted } from './model'

export const createGIP = createGipFactory({
  sharedEvents: [appStarted],
})

export const createGSP = createGspFactory()
