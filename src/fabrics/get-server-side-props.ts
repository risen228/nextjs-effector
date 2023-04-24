import { allSettled, fork, Scope, serialize } from 'effector'
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  PreviewData,
  Redirect,
} from 'next'
import { ParsedUrlQuery } from 'querystring'
import { INITIAL_STATE_KEY } from '../constants'
import { ContextNormalizers } from '../context-normalizers'
import { isPageEvent } from '../shared'
import { AnyProps, EmptyOrPageEvent, NonPromise } from '../types'

export type GetServerSidePropsExitResult = { redirect: Redirect } | { notFound: true };
export type GetServerSidePropsWithoutExitResult<Props> = Exclude<GetServerSidePropsResult<Props>, GetServerSidePropsExitResult>;

export interface CreateAppGSSPConfig {
  sharedEvents?: EmptyOrPageEvent<any, any>[]
  createServerScope?: (context: GetServerSidePropsContext) => Scope
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
) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>

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

      const scope = createServerScope(context)

      for (const event of events) {
        await allSettled(event, { scope, params: normalizedContext })
      }

      /*
       * Get user's GSSP result
       * Fallback to empty props object if no custom GSSP used
       */
      const gsspResult = customize
        ? await customize({ scope, context })
        : { props: {} as P }


      /*
       * Pass 404 and redirects as they are
       */
      if(['notFound', 'redirect'].some(v => v in gsspResult)) {
        return gsspResult as GetServerSidePropsExitResult
      } else {
        (gsspResult as GetServerSidePropsWithoutExitResult<P>).props = (gsspResult as GetServerSidePropsWithoutExitResult<P>).props ?? {} as P
      }

      /*
       * Serialize after customize to include user operations
       */
      const effectorProps = {
        [INITIAL_STATE_KEY]: serialize(scope),
      }

      // Handle props value as promise
      if((gsspResult as GetServerSidePropsWithoutExitResult<P>).props instanceof Promise) {
        (gsspResult as GetServerSidePropsWithoutExitResult<P>).props = (await (gsspResult as GetServerSidePropsWithoutExitResult<P>).props) as NonPromise<P>;
      }
      
      /*
       * Mix serialized Effector Scope values into the user props
       */
      
      Object.assign((gsspResult as GetServerSidePropsWithoutExitResult<P>).props, effectorProps)

      return gsspResult
    }
  }
}
