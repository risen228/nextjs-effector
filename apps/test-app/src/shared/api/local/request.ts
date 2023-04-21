import { createEffect } from 'effector'

export function createRequest<P = void, R = void>(fn: (params: P) => R) {
  return createEffect<P, R>(fn)
}
