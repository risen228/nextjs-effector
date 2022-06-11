import { PageEvent, StaticPageEvent } from './types'

export function isPageEvent(value: unknown): value is PageEvent {
  return Boolean(value)
}

export function isStaticPageEvent(value: unknown): value is StaticPageEvent {
  return Boolean(value)
}
