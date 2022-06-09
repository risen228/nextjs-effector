/* eslint-disable require-atomic-updates */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/jsx-props-no-spreading */

import {
  allSettled,
  createEvent,
  createStore,
  Event,
  fork,
  sample,
  Scope,
  serialize,
} from 'effector'
import { Provider, useEvent } from 'effector-react/scope'
import { GetServerSideProps, NextPageContext, PreviewData } from 'next'
import App, { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { useEffect, useRef } from 'react'

export interface SharedNextContext {
  pathname: string
  query: ParsedUrlQuery
  asPath?: string
}

export type NextEvent = Event<SharedNextContext> | Event<void>

function isNextEvent(value: unknown): value is NextEvent {
  return Boolean(value)
}

/**
 * It's not possible to use NextEvent in some operations
 * (since it's an union of Events)
 *
 * This problem can be solved by casting the union to the Event with SharedContext payload
 */
function strict(event: NextEvent): Event<SharedNextContext> {
  return event as Event<SharedNextContext>
}

// eslint-disable-next-line prettier/prettier
type AppType<P = {}, CP = {}, S = {}> =
  new (props: AppProps<P>) => App<P, CP, S>

interface Values {
  [sid: string]: any
}

interface AnyProps {
  [key: string]: any
}

const isClient = typeof window !== 'undefined'
const isServer = !isClient

const INITIAL_STATE_KEY = '__EFFECTOR_NEXTJS_INITIAL_STATE__'

// #region Application

let currentScope: Scope | null = null

type GetInitialProps<P> = (context: NextPageContext) => Promise<P>

export function useScope(values: Values = {}) {
  const valuesRef = useRef<Values | null>(null)

  if (isServer) {
    return fork({ values })
  }

  /*
   * Client first render
   * Create the new Scope and save it globally
   * We need it to be accessable inside getInitialProps
   */
  if (!currentScope) {
    const nextScope = fork({ values })

    currentScope = nextScope
    valuesRef.current = values
  }

  /*
   * Values have changed, most likely it's happened on the user navigation
   * Create the new Scope from the old one and save it as before
   */
  if (values !== valuesRef.current) {
    const currentValues = serialize(currentScope)
    const nextValues = Object.assign({}, currentValues, values)
    const nextScope = fork({ values: nextValues })

    currentScope = nextScope
    valuesRef.current = values
  }

  return currentScope
}

export function withEffector<P = {}, CP = {}, S = {}>(App: AppType<P, CP, S>) {
  return function EnhancedApp(props: P & AppProps<CP>) {
    const { [INITIAL_STATE_KEY]: initialState, ...pageProps } = props.pageProps

    const scope = useScope(initialState)

    return (
      <Provider value={scope}>
        <App {...props} pageProps={pageProps} />
      </Provider>
    )
  }
}

// #endregion

// #region Experimental Enhanced Events and Client Events

export interface NextEventOptions {
  runOnce?: boolean
}

const enhancedEventsCache = new Map<string, Event<any>>()

export function enhanceNextEvent(
  event: NextEvent,
  options: NextEventOptions = {}
): Event<SharedNextContext> {
  const key = `${event.sid}-${JSON.stringify(options)}`

  const cached = enhancedEventsCache.get(key)
  if (cached) return cached

  const { runOnce = false } = options

  const enhancedEvent = createEvent<SharedNextContext>()
  const $called = createStore(false, { sid: `${key}/called` })
  $called.on(strict(event), () => true)

  sample({
    clock: enhancedEvent,
    source: $called,
    filter: (called) => {
      if (runOnce && called) return false
      return true
    },
    fn: (_, payload) => payload,
    target: strict(event),
  })

  enhancedEventsCache.set(key, enhancedEvent)
  return enhancedEvent
}

export function useClientNextEvent(event: NextEvent) {
  const router = useRouter()
  const scoped = useEvent(strict(event))

  useEffect(() => {
    scoped(router)
  }, [router, scoped])
}

// #endregion

// #region Shared Effector Logic

export async function startEffectorModel<TContext extends SharedNextContext>(
  events: NextEvent[],
  context: TContext,
  existingScope?: Scope | null
) {
  const scope = existingScope ?? fork()

  // Always run events sequentially to prevent any race conditions
  for (const event of events) {
    await allSettled(event as Event<SharedNextContext>, {
      scope,
      params: context,
    })
  }

  return {
    scope,
    props: { [INITIAL_STATE_KEY]: serialize(scope) },
  }
}

// #endregion

// #region Get Initial Props

export interface CreateAppGIPConfig {
  sharedEvents?: NextEvent[]
  runSharedOnce?: boolean
}

export interface CreateGIPConfig<P> {
  pageEvent?: NextEvent
  create?: (scope: Scope) => GetInitialProps<P>
}

export function createAppGetInitialProps({
  sharedEvents = [],
  runSharedOnce = true,
}: CreateAppGIPConfig = {}) {
  const wrappedSharedEvents = sharedEvents.map((event) => {
    return enhanceNextEvent(event, { runOnce: runSharedOnce })
  })

  return function createGetInitialProps<P extends AnyProps = AnyProps>({
    pageEvent,
    create,
  }: CreateGIPConfig<P> = {}): GetInitialProps<P> {
    return async function getInitialProps(context) {
      /*
       * Determine the Effector events to run
       *
       * On server-side, use both app and page events
       *
       * On client-side, use only page event,
       * as we don't want to run app event again
       */
      const events = [...wrappedSharedEvents, pageEvent].filter(isNextEvent)

      /*
       * Execute resulting Effector events,
       * and wait for model to settle
       */
      const { scope, props } = await startEffectorModel(
        events,
        context,
        currentScope // Use already existing Scope on the client side
      )

      /*
       * On client-side, save the newly created Scope inside scopeMap
       * We need it to access on user navigation (see code above)
       */
      if (isClient) {
        currentScope = scope
      }

      /*
       * Get user's GIP props
       * Fallback to empty object if no custom GIP used
       */
      const userProps = create ? await create(scope)(context) : ({} as P)

      return Object.assign(userProps, props)
    }
  }
}

// #endregion

// #region Get Server Side Props

export interface CreateAppGSSPConfig {
  sharedEvents?: NextEvent[]
}

export interface CreateGSSPConfig<
  P extends AnyProps,
  Q extends ParsedUrlQuery,
  D extends PreviewData
> {
  pageEvent?: NextEvent
  create?: (scope: Scope) => GetServerSideProps<P, Q, D>
}

export function createAppGetServerSideProps({
  sharedEvents = [],
}: CreateAppGSSPConfig = {}) {
  return function createGetServerSideProps<
    P extends AnyProps = AnyProps,
    Q extends ParsedUrlQuery = ParsedUrlQuery,
    D extends PreviewData = PreviewData
  >({ pageEvent, create }: CreateGSSPConfig<P, Q, D> = {}): GetServerSideProps<
    P,
    Q,
    D
  > {
    return async function getServerSideProps(context) {
      /*
       * In GSSP, always run both "appEvent" and "pageEvent"
       */
      const events = [...sharedEvents, pageEvent].filter(isNextEvent)

      const sharedContext: SharedNextContext = {
        get pathname() {
          const domain = context.req.headers.host
          return 'https://' + domain + context.resolvedUrl
        },
        query: context.query,
        asPath: context.resolvedUrl,
      }

      /*
       * Execute app and page Effector events,
       * and wait for model to settle
       */
      const { scope, props } = await startEffectorModel(events, sharedContext)

      /*
       * Get user's GSSP result
       * Fallback to empty props object if no custom GSSP used
       */
      const gsspResult = create
        ? await create(scope)(context)
        : { props: {} as P }

      const hasProps = 'props' in gsspResult

      /*
       * Pass 404 and redirects as they are
       */
      if (!hasProps) {
        return gsspResult
      }

      /*
       * Mix serialized Effector Scope values into the user props
       */
      gsspResult.props = await gsspResult.props
      Object.assign(gsspResult.props, props)

      return gsspResult
    }
  }
}

// #endregion
