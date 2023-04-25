import { createEvent, createStore, Event, sample } from 'effector'
import { useUnit } from 'effector-react'
import * as NextRouter from 'next/router.js'
import { useEffect } from 'react'
import { ContextNormalizers } from './context-normalizers'
import { assertStrict } from './shared'
import { EmptyOrPageEvent, PageContext, StaticPageContext } from './types'

export interface EnhancedEventOptions {
  runOnce?: boolean
}

const useRouter = NextRouter.useRouter;

const enhancedEventsCache = new Map<string, Event<any>>()

type AnyPayload = PageContext<any, any> | StaticPageContext<any, any> | void

export function enhancePageEvent<P extends AnyPayload>(
  event: Event<P>,
  options: EnhancedEventOptions = {}
): Event<P> {
  const key = `${event.sid}-runOnce:${options.runOnce ?? false}`

  const cached = enhancedEventsCache.get(key)
  if (cached) return cached

  const { runOnce = false } = options

  const enhancedEvent = createEvent<P>()
  const $called = createStore(false, { sid: `${key}/called` })
  $called.on(event, () => true)

  sample({
    clock: enhancedEvent,
    source: $called,
    filter: (called) => {
      if (runOnce) return !called
      return true
    },
    fn: (_, payload) => payload,
    target: event,
  })

  enhancedEventsCache.set(key, enhancedEvent)
  return enhancedEvent
}

export function usePageEvent(
  event: EmptyOrPageEvent<any, any>,
  options: EnhancedEventOptions = {}
) {
  assertStrict(event)

  const router = useRouter()

  // the function has a cache inside, so we can safely call it on every render
  const enhancedEvent = enhancePageEvent(event, options)
  const boundEvent = useUnit(enhancedEvent)

  useEffect(() => {
    const context = ContextNormalizers.router(router)
    boundEvent(context)
  }, [router, boundEvent])
}
