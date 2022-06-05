import { createEffect } from 'effector'

export function createRequest<P = void, R = void>(data: R) {
  return createEffect<P, R>(async () => {
    return data
  })
}
