import { rest } from 'msw'
import { Bio, User } from '../types'
import { url } from './constants'

export const handlers = [
  rest.get(url('/users/me'), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<User>({
        username: 'risen',
        firstName: 'Evgeny',
        lastName: 'Rampage',
      })
    )
  }),

  rest.get(url('/profiles/me'), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<Bio>({
        birthDate: new Date().toISOString(),
        occupation: 'No occupation, just visiting',
      })
    )
  }),
]
