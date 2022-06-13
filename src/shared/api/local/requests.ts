import { AxiosRequestConfig } from 'axios'
import { attach, Effect } from 'effector'
import { url } from './mocks'
import { requestFx } from './request'
import { Bio, User } from './types'

export const getMeFx: Effect<void, User> = attach({
  effect: requestFx,
  mapParams: (): AxiosRequestConfig => ({
    method: 'get',
    url: url('/users/me'),
  }),
})

export const getBioFx: Effect<void, Bio | null> = attach({
  effect: requestFx,
  mapParams: (): AxiosRequestConfig => ({
    method: 'get',
    url: url('/profiles/me'),
  }),
})
