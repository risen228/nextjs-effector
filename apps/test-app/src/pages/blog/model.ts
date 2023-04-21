import { attach, createEvent, restore, sample } from 'effector'
import { localApi } from '@app/shared/api'

export const pageStarted = createEvent()

const loadAllPostsFx = attach({ effect: localApi.getAllPostsFx })
export const $posts = restore(loadAllPostsFx, [])

sample({
  clock: pageStarted,
  target: loadAllPostsFx,
})
