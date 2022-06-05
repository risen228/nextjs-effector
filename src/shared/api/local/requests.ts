import { createRequest } from './request'
import { Bio, User } from './types'

export const getMeFx = createRequest<void, User | null>({
  username: 'risen',
  firstName: 'Evgeny',
  lastName: 'Rampage',
})

export const getBioFx = createRequest<void, Bio | null>({
  birthDate: new Date().toISOString(),
  occupation: 'No occupation, just visiting',
})
