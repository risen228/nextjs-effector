export interface User {
  id: number
  username: string
  firstName: string
  lastName: string
}

export interface Bio {
  id: number
  birthDate: string
  occupation: string
}

export interface Category {
  id: number
  name: string

  postIds: number[]
}

export interface Post {
  id: number
  slug: string
  title: string
  content: string

  categoryIds: number[]
}
