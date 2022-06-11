import { createEvent, createStore, Event, sample } from 'effector'
import { useEvent } from 'effector-react/scope'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ContextNormalizers } from './context-normalizers'
import { PageContext, PageEvent, StaticPageContext } from './types'

export interface EnhancedEventOptions {
  runOnce?: boolean
}

const enhancedEventsCache = new Map<string, Event<any>>()

export function enhancePageEvent<T extends PageContext | StaticPageContext>(
  event: Event<T>,
  options: EnhancedEventOptions = {}
): Event<T> {
  const key = `${event.sid}-${JSON.stringify(options)}`

  const cached = enhancedEventsCache.get(key)
  if (cached) return cached

  const { runOnce = false } = options

  const enhancedEvent = createEvent<T>()
  const $called = createStore(false, { sid: `${key}/called` })
  $called.on(event, () => true)

  sample({
    clock: enhancedEvent,
    source: $called,
    filter: (called) => {
      if (runOnce && called) return false
      return true
    },
    fn: (_, payload) => payload,
    target: event,
  })

  enhancedEventsCache.set(key, enhancedEvent)
  return enhancedEvent
}

export function useClientPageEvent(event: PageEvent) {
  const router = useRouter()
  const boundEvent = useEvent(event)

  useEffect(() => {
    const context = ContextNormalizers.router(router)
    boundEvent(context)
  }, [router, boundEvent])
}
