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

type AppType = new (props: AppProps) => App
type Values = Record<string, unknown>

const INITIAL_STATE_KEY = '__EFFECTOR_INITIAL_STATE__'

export function useScope(pageProps: any) {
  const valuesRef = useRef<Values | null>(null)
  const clientScopeRef = useRef<Scope | null>(null)

  const values = pageProps[INITIAL_STATE_KEY] ?? {}

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

export function withEffector(App: AppType) {
  return function EnhancedApp(props: AppProps) {
    const scope = useScope(props.pageProps)

    return (
      <Provider value={scope}>
        <App {...props} />
      </Provider>
    )
  }
}

type ServerSidePropsEvent<
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> = Event<GetServerSidePropsContext<Q, D>> | Event<void>

type InitialPropsEvent = Event<NextPageContext> | Event<void>

type EffectorInitialProps = {
  [Key in typeof INITIAL_STATE_KEY]: {
    [sid: string]: any
  }
}

export async function getEffectorInitialProps<TContext>(
  events: Array<Event<TContext> | Event<void>>,
  context: TContext
): Promise<EffectorInitialProps> {
  const scope = fork()
  const promises = events.map((event) =>
    allSettled(event as Event<TContext>, { scope, params: context })
  )
  await Promise.all(promises)
  return { [INITIAL_STATE_KEY]: serialize(scope) }
}

interface CreateAppGSSPConfig {
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
    gssp?: GetServerSideProps<P, Q, D>
  ): GetServerSideProps<P, Q, D> {
    return async function getServerSideProps(context) {
      const result = gssp ? await gssp(context) : { props: {} as P }

      const hasProps = 'props' in result

      if (!hasProps) {
        return result
      }

      const effectorProps = await getEffectorInitialProps(
        [...globalEvents, ...pageEvents] as ServerSidePropsEvent[],
        context
      )
      result.props = await result.props
      Object.assign(result.props, effectorProps)

      return result
    }
  }
}

interface CreateAppGIPConfig {
  globalEvents?: InitialPropsEvent[]
}

type GetInitialProps<P> = (context: NextPageContext) => Promise<P>

export function createAppGetInitialProps({
  globalEvents = [],
}: CreateAppGIPConfig) {
  return function createGetInitialProps<
    P extends { [key: string]: any } = { [key: string]: any }
  >(
    pageEvents: InitialPropsEvent[],
    gip?: GetInitialProps<P>
  ): GetInitialProps<P> {
    return async function getInitialProps(context) {
      const props = gip ? await gip(context) : ({} as P)

      const events =
        typeof window === 'undefined'
          ? [...globalEvents, ...pageEvents]
          : pageEvents

      const effectorProps = await getEffectorInitialProps(events, context)
      Object.assign(props, effectorProps)
      return props
    }
  }
}
