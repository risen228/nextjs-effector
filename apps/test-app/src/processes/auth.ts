import { sample } from 'effector'
import { loadAuthenticatedUser } from '../entities/authenticated-user'
import { appStarted } from '../shared/events'

sample({
  clock: appStarted,
  target: loadAuthenticatedUser,
})
