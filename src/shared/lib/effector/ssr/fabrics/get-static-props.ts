import { Scope } from 'effector'
import {
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
  PreviewData,
} from 'next'
import { ParsedUrlQuery } from 'querystring'
import { isStaticPageEvent } from '../shared'
import { startModel } from '../start-model'
import { AnyProps, StaticPageEvent } from '../types'

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
      const { scope, props } = await startModel(events, context)

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
