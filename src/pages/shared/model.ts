import { createEvent, sample } from 'effector'
import { loadAuthenticatedUser } from '@app/entities/authenticated-user'

export const appStarted = createEvent()

sample({
  clock: appStarted,
  target: loadAuthenticatedUser,
})
