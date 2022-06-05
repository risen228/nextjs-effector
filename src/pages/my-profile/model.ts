import { attach, createEvent, restore, sample } from 'effector'
import { GetServerSidePropsContext } from 'next'
import { localApi } from '@app/shared/api'

export const pageStarted = createEvent<GetServerSidePropsContext>()

const loadBioFx = attach({ effect: localApi.getBioFx })

export const $bio = restore(loadBioFx, null)

sample({
  clock: pageStarted,
  target: loadBioFx,
})
