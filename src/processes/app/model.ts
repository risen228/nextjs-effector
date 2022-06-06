import { createEvent, sample } from 'effector'
import { GetServerSidePropsContext } from 'next'
import { loadAuthenticatedUser } from '@app/entities/authenticated-user'

export const appStarted = createEvent<GetServerSidePropsContext>()

sample({
  clock: appStarted,
  target: loadAuthenticatedUser,
})
