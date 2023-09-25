import { allSettled, fork, Scope, serialize, Store } from 'effector'
import { NextPageContext } from 'next'
import { INITIAL_STATE_KEY } from '../constants'
import { ContextNormalizers } from '../context-normalizers'
import { enhancePageEvent } from '../enhanced-events'
import { env } from '../env'
import { assertStrict, isPageEvent } from '../shared'
import { state } from '../state'
import { AnyProps, EmptyOrPageEvent, GetInitialProps } from '../types'

export interface CreateAppGIPConfig {
  sharedEvents?: EmptyOrPageEvent[]
  runSharedOnce?: boolean
  createServerScope?: (context: NextPageContext) => Scope | Promise<Scope>
  customize?: CustomizeGIP
  serializeOptions?: Parameters<typeof serialize>[1]
}

export interface CustomizeGIPParams {
  scope: Scope
  context: NextPageContext
}

export type CustomizeGIP<P extends AnyProps = AnyProps> = (
  params: CustomizeGIPParams
) => void | Promise<void> | P | Promise<P>

export interface CreateGIPConfig<P extends AnyProps = AnyProps> {
  pageEvent?: EmptyOrPageEvent<any, any>
  customize?: CustomizeGIP<P>
}

export function createGIPFactory({
  sharedEvents = [],
  runSharedOnce = true,
  createServerScope = () => fork(),
  customize: factoryCustomize,
  serializeOptions
}: CreateAppGIPConfig = {}) {
  /*
   * When "runSharedOnce" is equals to "true",
   * create enhanced shared events with "runOnce"
   */
  const wrappedSharedEvents = sharedEvents.map((event) => {
    assertStrict(event)
    return enhancePageEvent(event, { runOnce: runSharedOnce })
  })

  return function createGIP<P extends AnyProps = AnyProps>({
    pageEvent,
    customize: pageCustomize,
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

      const scope = state.clientScope ?? await createServerScope(context)

      for (const event of events) {
        await allSettled(event, { scope, params: normalizedContext })
      }

      /*
       * On client-side, save the newly created Scope inside scopeMap
       * We need it to access on user navigation (see code above)
       */
      if (env.isClient) {
        // eslint-disable-next-line require-atomic-updates
        state.clientScope = scope
      }
      
      const factoryGipResult = await factoryCustomize?.({ scope, context }) ?? {} as P
      const pageGipResult = await pageCustomize?.({ scope, context }) ?? {} as P
      const initialProps: P = { ...factoryGipResult, ...pageGipResult }

      /*
       * Serialize after customize to include user operations
       */
      const effectorProps = {
        [INITIAL_STATE_KEY]: serialize(scope, serializeOptions),
      }

      return Object.assign(initialProps, effectorProps)
    }
  }
}
