import { allSettled, fork, Scope, serialize } from 'effector'
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  PreviewData,
} from 'next'
import { ParsedUrlQuery } from 'querystring'
import { INITIAL_STATE_KEY } from '../constants'
import { ContextNormalizers } from '../context-normalizers'
import { isPageEvent } from '../shared'
import { AnyProps, EmptyOrPageEvent } from '../types'

export interface CreateAppGSSPConfig {
  sharedEvents?: EmptyOrPageEvent<any, any>[]
  createServerScope?: (context: GetServerSidePropsContext) => Scope | Promise<Scope>
  customize?: CustomizeGSSP
  serializeOptions?: Parameters<typeof serialize>[1]
}

export interface CustomizeGSSPParams<
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> {
  scope: Scope
  context: GetServerSidePropsContext<Q, D>
}

export type CustomizeGSSP<
  P extends AnyProps = AnyProps,
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> = (
  params: CustomizeGSSPParams<Q, D>
) => void | Promise<void> | GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>

export interface CreateGSSPConfig<
  P extends AnyProps,
  Q extends ParsedUrlQuery,
  D extends PreviewData
> {
  pageEvent?: EmptyOrPageEvent<any, any>
  customize?: CustomizeGSSP<P, Q, D>
}

export function createGSSPFactory({
  sharedEvents = [],
  createServerScope = () => fork(),
  customize: factoryCustomize,
  serializeOptions
}: CreateAppGSSPConfig = {}) {
  return function createGSSP<
    P extends AnyProps = AnyProps,
    Q extends ParsedUrlQuery = ParsedUrlQuery,
    D extends PreviewData = PreviewData
  >({
    pageEvent,
    customize: pageCustomize,
  }: CreateGSSPConfig<P, Q, D> = {}): GetServerSideProps<P, Q, D> {
    return async function getServerSideProps(context) {
      /*
       * In GSSP, always run both "sharedEvents" and "pageEvent"
       */
      const events = [...sharedEvents, pageEvent].filter(isPageEvent)

      const normalizedContext = ContextNormalizers.getServerSideProps(context)

      const scope = await createServerScope(context)

      for (const event of events) {
        await allSettled(event, { scope, params: normalizedContext })
      }

      const factoryGsspResult = await factoryCustomize?.({ scope, context }) ?? { props: {} as P }

      /*
       * Pass 404 and redirects as they are
       */
      if ('redirect' in factoryGsspResult || 'notFound' in factoryGsspResult) {
        return factoryGsspResult
      }

      const pageGsspResult = await pageCustomize?.({ scope, context }) ?? { props: {} as P }

      /*
       * Pass 404 and redirects as they are
       */
      if ('redirect' in pageGsspResult || 'notFound' in pageGsspResult) {
        return pageGsspResult
      }

      const gsspResult: GetServerSidePropsResult<P> = {
        props: {
          ...factoryGsspResult.props,
          ...pageGsspResult.props
        }
      }

      /*
       * Serialize after customize to include user operations
       */
      const effectorProps = {
        [INITIAL_STATE_KEY]: serialize(scope, serializeOptions),
      }

      /*
       * Mix serialized Effector Scope values into the user props
       */
      gsspResult.props = await gsspResult.props
      Object.assign(gsspResult.props, effectorProps)

      return gsspResult
    }
  }
}
