import { createRequest } from './request'
import { Bio, Category, Post, User } from './types'

export const getMeFx = createRequest<void, User | null>(() => ({
  id: 1,
  username: 'risen',
  firstName: 'Evgeny',
  lastName: 'Rampage',
}))

export const getBioFx = createRequest<void, Bio | null>(() => ({
  id: 1,
  birthDate: new Date().toISOString(),
  occupation: 'No occupation, just visiting',
}))

const categories: Category[] = [
  {
    id: 1,
    name: 'IT',
    postIds: [1],
  },
  {
    id: 2,
    name: 'Society',
    postIds: [1, 2],
  },
]

const posts: Post[] = [
  {
    id: 1,
    slug: 'effector-is-the-best-stm',
    title: 'Effector is the best State Manager library',
    content: 'Prove me wrong',
    categoryIds: [1, 2],
  },
  {
    id: 2,
    slug: 'there-are-only-three-genders',
    title: 'There are only three genders',
    content: 'Male, female, and Apache Helicopter',
    categoryIds: [2],
  },
]

export const getAllCategoriesFx = createRequest<void, Category[]>(
  () => categories
)

export const getCategoriesByIdFx = createRequest<number[], Category[]>((ids) =>
  categories.filter((category) => ids.includes(category.id))
)

export const getCategoryFx = createRequest<number, Category | null>(
  (id) => categories.find((category) => category.id === id) ?? null
)

export const getAllPostsFx = createRequest<void, Post[]>(() => posts)

export const getPostBySlugFx = createRequest<string, Post | null>(
  (slug) => posts.find((post) => post.slug === slug) ?? null
)
