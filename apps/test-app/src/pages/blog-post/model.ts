import { attach, createEvent, restore, sample } from 'effector'
import { StaticPageContext } from 'nextjs-effector'
import { localApi } from '@app/shared/api'

export const pageStarted = createEvent<StaticPageContext<{ slug: string }>>()

const loadPostFx = attach({ effect: localApi.getPostBySlugFx })
const loadCategoriesFx = attach({ effect: localApi.getCategoriesByIdFx })
export const $post = restore(loadPostFx, null)
export const $categories = restore(loadCategoriesFx, [])

sample({
  source: pageStarted,
  fn: ({ params }) => params!.slug,
  target: loadPostFx,
})

sample({
  clock: loadPostFx.done,
  source: $post,
  filter: Boolean,
  fn: (post) => post.categoryIds,
  target: loadCategoriesFx,
})
