import { allSettled, Event, fork, Scope, serialize } from 'effector'
import { INITIAL_STATE_KEY } from './constants'
import { PageContext, StaticPageContext } from './types'

type AnyPayload = PageContext<any, any> | StaticPageContext<any, any> | void

export async function startModel<T extends AnyPayload>(
  events: Event<T>[],
  context: T,
  existingScope?: Scope | null
) {
  const scope = existingScope ?? fork()

  // Always run events sequentially to prevent any race conditions
  for (const event of events) {
    await allSettled(event, { scope, params: context })
  }

  const props = { [INITIAL_STATE_KEY]: serialize(scope) }

  return { scope, props }
}
