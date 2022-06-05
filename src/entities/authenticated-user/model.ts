import { attach, createEvent, restore, sample } from 'effector'
import { localApi } from '@app/shared/api'

const loadMeFx = attach({ effect: localApi.getMeFx })

export const loadAuthenticatedUser = createEvent()

export const $authenticatedUser = restore(loadMeFx, null)

sample({
  clock: loadAuthenticatedUser,
  target: loadMeFx,
})
