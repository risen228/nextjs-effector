import { Scope } from 'effector'
import { NextPageContext } from 'next'
import { ContextNormalizers } from '../context-normalizers'
import { enhancePageEvent } from '../enhanced-events'
import { env } from '../env'
import { isPageEvent } from '../shared'
import { startModel } from '../start-model'
import { state } from '../state'
import { AnyProps, GetInitialProps, PageEvent } from '../types'

export interface CreateAppGIPConfig {
  sharedEvents?: PageEvent<any, any>[]
  runSharedOnce?: boolean
}

interface CustomizeGIPParams {
  scope: Scope
  context: NextPageContext
}

export interface CreateGIPConfig<P> {
  pageEvent?: PageEvent<any, any>
  customize?: (params: CustomizeGIPParams) => P | Promise<P>
}

export function createAppGetInitialProps({
  sharedEvents = [],
  runSharedOnce = true,
}: CreateAppGIPConfig = {}) {
  /*
   * When "runSharedOnce" is equals to "true",
   * create enhanced shared events with "runOnce"
   */
  const wrappedSharedEvents = sharedEvents.map((event) => {
    return enhancePageEvent(event, { runOnce: runSharedOnce })
  })

  return function createGetInitialProps<P extends AnyProps = AnyProps>({
    pageEvent,
    customize,
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

      /*
       * Execute resulting Effector events,
       * and wait for model to settle
       */
      const { scope, props } = await startModel(
        events,
        normalizedContext,
        state.clientScope // Use already existing Scope on the client side
      )

      /*
       * On client-side, save the newly created Scope inside scopeMap
       * We need it to access on user navigation (see code above)
       */
      if (env.isClient) {
        // eslint-disable-next-line require-atomic-updates
        state.clientScope = scope
      }

      /*
       * Get user's GIP props
       * Fallback to empty object if no custom GIP used
       */
      const userProps = customize
        ? await customize({ scope, context })
        : ({} as P)

      return Object.assign(userProps, props)
    }
  }
}
