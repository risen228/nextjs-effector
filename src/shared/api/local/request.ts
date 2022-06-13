import axios, { AxiosRequestConfig } from 'axios'
import { createEffect } from 'effector'
import { setup } from './mocks'

export const requestFx = createEffect(async (config: AxiosRequestConfig) => {
  /*
   * We cannot setup mocks once because in that case, Next.js dev mode -
   * - creates multiple interceptors and everything fails
   *
   * The solution is to setup mocks before each requests and remove them after it
   */
  const uninstall = await setup()
  const response = await axios(config)
  uninstall()

  return response.data
})
