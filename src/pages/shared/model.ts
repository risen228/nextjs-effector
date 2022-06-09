import { createEvent, sample } from 'effector'
import { loadAuthenticatedUser } from '@app/entities/authenticated-user'
import { SharedNextContext } from '@app/shared/lib/effector'

export const appStarted = createEvent<SharedNextContext>()

appStarted.watch(() => console.info('[Events] appStarted'))

sample({
  clock: appStarted,
  target: loadAuthenticatedUser,
})
