import { createEffect, createEvent, restore, sample } from 'effector'
import { StaticPageContext } from '@app/shared/lib/effector'

export const pageStarted = createEvent<StaticPageContext>()

const createContentFx = createEffect(() => 'Static Page Content')

export const $content = restore(createContentFx, null)

sample({
  clock: pageStarted,
  target: createContentFx,
})
