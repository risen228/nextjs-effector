import { createEvent, sample } from 'effector'
import { loadAuthenticatedUser } from '@app/entities/authenticated-user'

export const appStarted = createEvent()

appStarted.watch(() => console.info('[Event] appStarted'))

sample({
  clock: appStarted,
  target: loadAuthenticatedUser,
})
