/* eslint-disable react/destructuring-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/jsx-props-no-spreading */

import { allSettled, Event, fork, Scope, serialize } from 'effector'
import { Provider } from 'effector-react/scope'
import {
  GetServerSideProps,
  GetServerSidePropsContext,
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

type StartEvent<
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> = Event<GetServerSidePropsContext<Q, D>>

export async function getInitialProps(
  events: StartEvent[],
  params: GetServerSidePropsContext
) {
  const scope = fork()
  const promises = events.map((event) => allSettled(event, { scope, params }))
  await Promise.all(promises)
  return { [INITIAL_STATE_KEY]: serialize(scope) }
}

interface CreateAppGSSPConfig {
  globalEvents?: StartEvent[]
}

export function createAppGSSP({ globalEvents = [] }: CreateAppGSSPConfig) {
  return function createGSSP<
    P extends { [key: string]: any } = { [key: string]: any },
    Q extends ParsedUrlQuery = ParsedUrlQuery,
    D extends PreviewData = PreviewData
  >(
    pageEvents: StartEvent<Q, D>[],
    gssp?: GetServerSideProps<P, Q, D>
  ): GetServerSideProps<P, Q, D> {
    return async function getServerSideProps(context) {
      const result = gssp ? await gssp(context) : { props: {} as P }

      const hasProps = 'props' in result

      if (!hasProps) {
        return result
      }

      const initialProps = await getInitialProps(
        [...globalEvents, ...pageEvents] as StartEvent[],
        context
      )
      result.props = await result.props
      Object.assign(result.props, initialProps)

      return result
    }
  }
}
