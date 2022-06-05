import { createEvent, sample } from 'effector'
import { GetServerSidePropsContext } from 'next'
import { loadAuthenticatedUser } from '../authenticated-user'

export const appStarted = createEvent<GetServerSidePropsContext>()

sample({
  clock: appStarted,
  target: loadAuthenticatedUser,
})
