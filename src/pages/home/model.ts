import { createEvent } from 'effector'
import { GetServerSidePropsContext } from 'next'

export const pageStarted = createEvent<GetServerSidePropsContext>()
