import { createEvent, sample } from 'effector'
import { loadAuthenticatedUser } from '@app/entities/authenticated-user'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const appStarted = createEvent<any>()

sample({
  clock: appStarted,
  target: loadAuthenticatedUser,
})
