import { attach, createEvent, restore, sample } from 'effector'
import { localApi } from '@app/shared/api'
import { PageContext } from '@app/shared/lib/effector'

export const pageStarted = createEvent<PageContext>()

const loadBioFx = attach({ effect: localApi.getBioFx })

export const $bio = restore(loadBioFx, null)

sample({
  clock: pageStarted,
  target: loadBioFx,
})
