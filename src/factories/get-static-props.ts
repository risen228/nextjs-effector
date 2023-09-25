import { allSettled, fork, Scope, serialize } from 'effector'
import {
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
  PreviewData
} from 'next'
import { ParsedUrlQuery } from 'querystring'
import { INITIAL_STATE_KEY } from '../constants'
import { ContextNormalizers } from '../context-normalizers'
import { isStaticPageEvent } from '../shared'
import { AnyProps, EmptyOrStaticPageEvent } from '../types'

export interface CreateAppGSPConfig {
  sharedEvents?: EmptyOrStaticPageEvent<any, any>[]
  createServerScope?: (context: GetStaticPropsContext) => Scope | Promise<Scope>
  serializeOptions?: Parameters<typeof serialize>[1]
}

export interface CustomizeGSPParams<
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> {
  scope: Scope
  context: GetStaticPropsContext<Q, D>
}

export type LightweightGetStaticPropsResult = Pick<GetStaticPropsResult<any>, 'revalidate'>

export type CustomizeGSP<
  P extends AnyProps = AnyProps,
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  D extends PreviewData = PreviewData
> = (
  params: CustomizeGSPParams<Q, D>
) => LightweightGetStaticPropsResult | Promise<LightweightGetStaticPropsResult> | GetStaticPropsResult<P> | Promise<GetStaticPropsResult<P>>

export interface CreateGSPConfig<
  P extends AnyProps,
  Q extends ParsedUrlQuery,
  D extends PreviewData
> {
  pageEvent?: EmptyOrStaticPageEvent<Q, D>
  customize?: CustomizeGSP<P, Q, D>
}

export function createGSPFactory({
  sharedEvents = [],
  createServerScope = () => fork(),
  serializeOptions
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

      const scope = await createServerScope(context)

      for (const event of events) {
        await allSettled(event, { scope, params: normalizedContext })
      }

      let gspResult: GetStaticPropsResult<P> = { props: {} as P }

      /*
       * Override with user's GSP result when "customize" defined
       */
      if (customize) {
        const customGspResult = await customize({ scope, context })
        if ('notFound' in customGspResult) gspResult = customGspResult
        else if ('redirect' in customGspResult) gspResult = customGspResult
        else gspResult = { props: {} as P, ...customGspResult }
      }

      /*
       * Pass 404 and redirects as they are
       */
      if ('notFound' in gspResult || 'redirect' in gspResult) {
        return gspResult
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
      Object.assign(gspResult.props, effectorProps)

      return gspResult
    }
  }
}
