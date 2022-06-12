import { createEffect, createEvent, restore, sample } from 'effector'

export const pageStarted = createEvent()

const createContentFx = createEffect(() => 'Static Page Content')

export const $content = restore(createContentFx, null)

sample({
  clock: pageStarted,
  target: createContentFx,
})
