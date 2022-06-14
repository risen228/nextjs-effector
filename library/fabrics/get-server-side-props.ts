import { Scope } from 'effector'
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  PreviewData,
} from 'next'
import { ParsedUrlQuery } from 'querystring'
import { ContextNormalizers } from '../context-normalizers'
import { isPageEvent } from '../shared'
import { startModel } from '../start-model'
import { AnyProps, EmptyOrPageEvent } from '../types'

export interface CreateAppGSSPConfig {
  sharedEvents?: EmptyOrPageEvent<any, any>[]
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
  pageEvent?: EmptyOrPageEvent<any, any>
  customize?: (
    params: CustomizeGSSPParams<Q, D>
  ) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>
}

export function createGSSPFactory({
  sharedEvents = [],
}: CreateAppGSSPConfig = {}) {
  return function createGSSP<
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
      const { scope, props } = await startModel(events, normalizedContext)

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
