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
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
  NextComponentType,
  NextPageContext,
  PreviewData,
} from 'next'
import { AppContext, AppProps } from 'next/app'
import { NextRouter, useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { useEffect, useRef } from 'react'

export interface PageContext<
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  P extends ParsedUrlQuery = ParsedUrlQuery
> {
  route?: string
  pathname: string
  query: Q
  params: P
  asPath?: string
  locale?: string
  locales?: string[]
  defaultLocale?: string
}

export type PageEvent<
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  P extends ParsedUrlQuery = ParsedUrlQuery
> = Event<PageContext<Q, P>>

export type StaticPageContext<
  P extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> = GetStaticPropsContext<P, D>

export type StaticPageEvent<
  P extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> = Event<StaticPageContext<P, D>>

interface Values {
  [sid: string]: any
}

interface AnyProps {
  [key: string]: any
}

const isClient = typeof window !== 'undefined'
const isServer = !isClient

const INITIAL_STATE_KEY = '__EFFECTOR_NEXTJS_INITIAL_STATE__'

function isPageEvent(value: unknown): value is PageEvent {
  return Boolean(value)
}

function isStaticPageEvent(value: unknown): value is StaticPageEvent {
  return Boolean(value)
}

function normalizeQuery(query: ParsedUrlQuery, route: string) {
  const onlyQuery: ParsedUrlQuery = {}
  const onlyParams: ParsedUrlQuery = {}

  for (const [name, value] of Object.entries(query)) {
    if (!value) continue

    // handle catch and optional catch
    if (Array.isArray(value) && route.includes(`[...${name}]`)) {
      onlyParams[name] = value
      continue
    }

    if (route.includes(`[${name}]`)) {
      onlyParams[name] = value
      continue
    }

    onlyQuery[name] = value
  }

  return {
    params: onlyParams,
    query: onlyQuery,
  }
}

function removeParamsFromQuery(query: ParsedUrlQuery, params: ParsedUrlQuery) {
  const filteredEntries = Object.entries(query).filter(([key]) => {
    const hasProperty = Object.prototype.hasOwnProperty.call(params, key)
    return !hasProperty
  })

  return Object.fromEntries(filteredEntries)
}

function buildPathname({ req, resolvedUrl }: GetServerSidePropsContext) {
  const domain = req.headers.host
  const protocol = req.headers.referer?.split('://')?.[0] ?? 'https'
  return `${protocol}://` + domain + resolvedUrl
}

const ContextNormalizers = {
  router: (router: NextRouter): PageContext => ({
    ...router,
    ...normalizeQuery(router.query, router.route),
  }),
  getInitialProps: (context: NextPageContext): PageContext => ({
    ...context,
    route: context.pathname,
    ...normalizeQuery(context.query, context.pathname),
  }),
  getServerSideProps: (context: GetServerSidePropsContext): PageContext => ({
    ...context,
    params: context.params ?? {},
    query: removeParamsFromQuery(context.query, context.params ?? {}),
    pathname: buildPathname(context),
  }),
}

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

export function withEffector(App: NextComponentType<AppContext, any, any>) {
  return function EnhancedApp(props: AppProps) {
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

// #endregion

// #region Shared Logic And Types

async function startEffectorModel<T extends PageContext | StaticPageContext>(
  events: Event<T>[],
  context: T,
  existingScope?: Scope | null
) {
  const scope = existingScope ?? fork()

  // Always run events sequentially to prevent any race conditions
  for (const event of events) {
    await allSettled(event, { scope, params: context })
  }

  const props = { [INITIAL_STATE_KEY]: serialize(scope) }

  return { scope, props }
}

// #endregion

// #region Get Initial Props

export interface CreateAppGIPConfig {
  sharedEvents?: PageEvent<any, any>[]
  runSharedOnce?: boolean
}

interface CustomizeGIPParams {
  scope: Scope
  context: NextPageContext
}

export interface CreateGIPConfig<P> {
  pageEvent?: PageEvent<any, any>
  customize?: (params: CustomizeGIPParams) => P | Promise<P>
}

export function createAppGetInitialProps({
  sharedEvents = [],
  runSharedOnce = true,
}: CreateAppGIPConfig = {}) {
  /*
   * When "runSharedOnce" is equals to "true",
   * create enhanced shared events with "runOnce"
   */
  const wrappedSharedEvents = sharedEvents.map((event) => {
    return enhancePageEvent(event, { runOnce: runSharedOnce })
  })

  return function createGetInitialProps<P extends AnyProps = AnyProps>({
    pageEvent,
    customize,
  }: CreateGIPConfig<P> = {}): GetInitialProps<P> {
    return async function getInitialProps(context) {
      /*
       * Determine the Effector events to run
       *
       * On server-side, use both shared and page events
       *
       * On client-side, use only page event,
       * as we don't want to run shared events again
       */
      const events = [...wrappedSharedEvents, pageEvent].filter(isPageEvent)

      const normalizedContext = ContextNormalizers.getInitialProps(context)

      /*
       * Execute resulting Effector events,
       * and wait for model to settle
       */
      const { scope, props } = await startEffectorModel(
        events,
        normalizedContext,
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
      const userProps = customize
        ? await customize({ scope, context })
        : ({} as P)

      return Object.assign(userProps, props)
    }
  }
}

// #endregion

// #region Get Server Side Props

export interface CreateAppGSSPConfig {
  sharedEvents?: PageEvent<any, any>[]
}

interface CustomizeGSSPParams<
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> {
  scope: Scope
  context: GetServerSidePropsContext<Q, D>
}

export interface CreateGSSPConfig<
  P extends AnyProps,
  Q extends ParsedUrlQuery,
  D extends PreviewData
> {
  pageEvent?: PageEvent<any, any>
  customize?: (
    params: CustomizeGSSPParams<Q, D>
  ) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>
}

export function createAppGetServerSideProps({
  sharedEvents = [],
}: CreateAppGSSPConfig = {}) {
  return function createGetServerSideProps<
    P extends AnyProps = AnyProps,
    Q extends ParsedUrlQuery = ParsedUrlQuery,
    D extends PreviewData = PreviewData
  >({
    pageEvent,
    customize,
  }: CreateGSSPConfig<P, Q, D> = {}): GetServerSideProps<P, Q, D> {
    return async function getServerSideProps(context) {
      /*
       * In GSSP, always run both "sharedEvents" and "pageEvent"
       */
      const events = [...sharedEvents, pageEvent].filter(isPageEvent)

      const normalizedContext = ContextNormalizers.getServerSideProps(context)

      /*
       * Execute app and page Effector events,
       * and wait for model to settle
       */
      const { scope, props } = await startEffectorModel(
        events,
        normalizedContext
      )

      /*
       * Get user's GSSP result
       * Fallback to empty props object if no custom GSSP used
       */
      const gsspResult = customize
        ? await customize({ scope, context })
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

// #region Get Static Props

export interface CreateAppGSPConfig {
  sharedEvents?: StaticPageEvent<any, any>[]
}

interface CustomizeGSPParams<
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> {
  scope: Scope
  context: GetStaticPropsContext<Q, D>
}

export interface CreateGSPConfig<
  P extends AnyProps,
  Q extends ParsedUrlQuery,
  D extends PreviewData
> {
  pageEvent?: StaticPageEvent<Q, D>
  customize?: (
    params: CustomizeGSPParams
  ) => GetStaticPropsResult<P> | Promise<GetStaticPropsResult<P>>
}

export function createAppGetStaticProps({
  sharedEvents = [],
}: CreateAppGSPConfig = {}) {
  return function createGetStaticProps<
    P extends AnyProps = AnyProps,
    Q extends ParsedUrlQuery = ParsedUrlQuery,
    D extends PreviewData = PreviewData
  >({ pageEvent, customize }: CreateGSPConfig<P, Q, D> = {}): GetStaticProps<
    P,
    Q,
    D
  > {
    return async function getStaticProps(context) {
      /*
       * In GSP, always run both "sharedEvents" and "pageEvent"
       */
      const events = [...sharedEvents, pageEvent].filter(isStaticPageEvent)

      /*
       * Execute app and page Effector events,
       * and wait for model to settle
       */
      const { scope, props } = await startEffectorModel(events, context)

      /*
       * Get user's GSP result
       * Fallback to empty props object if no custom GSP used
       */
      const gspResult = customize
        ? await customize({ scope, context })
        : { props: {} as P }

      const hasProps = 'props' in gspResult

      /*
       * Pass 404 and redirects as they are
       */
      if (!hasProps) {
        return gspResult
      }

      /*
       * Mix serialized Effector Scope values into the user props
       */
      Object.assign(gspResult.props, props)

      return gspResult
    }
  }
}

// #endregion
