/* eslint-disable react/destructuring-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/jsx-props-no-spreading */

import { allSettled, Event, fork, Scope, serialize } from 'effector'
import { Provider } from 'effector-react/scope'
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPageContext,
  PreviewData,
} from 'next'
import App, { AppProps } from 'next/app'
import { ParsedUrlQuery } from 'querystring'
import { useRef } from 'react'

// eslint-disable-next-line prettier/prettier
type AppType<P = {}, CP = {}, S = {}> =
  new (props: AppProps<P>) => App<P, CP, S>

interface Values {
  [sid: string]: any
}

const INITIAL_STATE_KEY = '__EFFECTOR_INITIAL_STATE__'

export function useScope(values: Values = {}) {
  const valuesRef = useRef<Values | null>(null)
  const clientScopeRef = useRef<Scope | null>(null)

  if (typeof window === 'undefined') {
    return fork({ values })
  }

  if (!clientScopeRef.current) {
    const scope = fork({ values })
    clientScopeRef.current = scope
    valuesRef.current = values
  }

  if (values !== valuesRef.current) {
    valuesRef.current = values
    const prev = serialize(clientScopeRef.current)
    const next = Object.assign({}, prev, values)
    clientScopeRef.current = fork({ values: next })
  }

  return clientScopeRef.current
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

export type ServerSidePropsEvent<
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> = Event<GetServerSidePropsContext<Q, D>> | Event<void>

export type InitialPropsEvent = Event<NextPageContext> | Event<void>

export type StartEvent = ServerSidePropsEvent<any, any> | InitialPropsEvent

export async function startEffectorModel<TContext>(
  events: Array<Event<TContext> | Event<void>>,
  context: TContext,
  values: Values = {}
) {
  const scope = fork({ values })
  const promises = events.map((event) =>
    allSettled(event as Event<TContext>, { scope, params: context })
  )
  await Promise.all(promises)

  return {
    scope,
    props: { [INITIAL_STATE_KEY]: serialize(scope) },
  }
}

export interface CreateAppGSSPConfig {
  globalEvents?: ServerSidePropsEvent[]
}

export function createAppGetServerSideProps({
  globalEvents = [],
}: CreateAppGSSPConfig) {
  return function createGetServerSideProps<
    P extends { [key: string]: any } = { [key: string]: any },
    Q extends ParsedUrlQuery = ParsedUrlQuery,
    D extends PreviewData = PreviewData
  >(
    pageEvents: ServerSidePropsEvent<Q, D>[],
    gsspFabric?: (scope: Scope) => GetServerSideProps<P, Q, D>
  ): GetServerSideProps<P, Q, D> {
    return async function getServerSideProps(context) {
      /*
       * Execute app and page Effector events,
       * and wait for model to settle
       */
      const { scope, props } = await startEffectorModel(
        [...globalEvents, ...pageEvents] as ServerSidePropsEvent[],
        context
      )

      /*
       * Get user's GSSP result
       * Fallback to empty props object if no custom GSSP used
       */
      const gsspResult = gsspFabric
        ? await gsspFabric(scope)(context)
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

const scopeMap = new Map<string, Scope>()

type GetInitialProps<P> = (context: NextPageContext) => Promise<P>

export interface CreateAppGIPConfig {
  namespace?: string
  globalEvents?: InitialPropsEvent[]
}

export function createAppGetInitialProps({
  namespace = 'global',
  globalEvents = [],
}: CreateAppGIPConfig) {
  return function createGetInitialProps<
    P extends { [key: string]: any } = { [key: string]: any }
  >(
    pageEvents: InitialPropsEvent[],
    gipFabric?: (scope: Scope) => GetInitialProps<P>
  ): GetInitialProps<P> {
    return async function getInitialProps(context) {
      const isClient = typeof window !== 'undefined'

      /*
       * Determine the Effector events to run
       *
       * On server-side, use both app and page events
       *
       * On client-side, use only page events,
       * as we don't want to run app events again
       */
      const events = isClient ? pageEvents : [...globalEvents, ...pageEvents]

      /*
       * On client-side, get the current Scope values
       * They will be added to the newly created Scope before any events execution
       */
      const existingScope = scopeMap.get(namespace)
      const hasValues = isClient && existingScope
      const values = hasValues ? serialize(existingScope) : {}

      /*
       * Execute resulting Effector events,
       * and wait for model to settle
       */
      const { scope, props } = await startEffectorModel(events, context, values)

      /*
       * On client-side, save the newly created Scope inside scopeMap
       * We need it to access it later - on user navigation
       */
      if (isClient) {
        scopeMap.set(namespace, scope)
      }

      /*
       * Get user's GIP props
       * Fallback to empty object if no custom GIP used
       */
      const userProps = gipFabric ? await gipFabric(scope)(context) : ({} as P)

      Object.assign(userProps, props)
      return userProps
    }
  }
}
