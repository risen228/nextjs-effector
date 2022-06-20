import { Scope } from 'effector'
import {
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
  PreviewData,
} from 'next'
import { ParsedUrlQuery } from 'querystring'
import { ContextNormalizers } from '../context-normalizers'
import { isStaticPageEvent } from '../shared'
import { startModel } from '../start-model'
import { AnyProps, EmptyOrStaticPageEvent } from '../types'

export interface CreateAppGSPConfig {
  sharedEvents?: EmptyOrStaticPageEvent<any, any>[]
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
  pageEvent?: EmptyOrStaticPageEvent<Q, D>
  customize?: (
    params: CustomizeGSPParams
  ) => GetStaticPropsResult<P> | Promise<GetStaticPropsResult<P>>
}

export function createGSPFactory({
  sharedEvents = [],
}: CreateAppGSPConfig = {}) {
  return function createGSP<
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

      const normalizedContext = ContextNormalizers.getStaticProps(context)

      /*
       * Execute app and page Effector events,
       * and wait for model to settle
       */
      const { scope, props } = await startModel(events, normalizedContext)

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
