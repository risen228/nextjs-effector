import { createEvent, createStore, Event, sample } from "effector";
import { useUnit } from "effector-react";
import * as NextRouter from "next/router.js";
import { useEffect } from "react";
import { ContextNormalizers } from "./context-normalizers";
import { assertStrict } from "./shared";
import { EmptyOrPageEvent, PageContext, StaticPageContext } from "./types";

export interface EnhancedEventOptions {
  runOnce?: boolean;
}

const enhancedEventsCache = new Map<string, Event<any>>();

type AnyPayload = PageContext<any, any> | StaticPageContext<any, any> | void;

export function enhancePageEvent<P extends AnyPayload>(
  event: Event<P>,
  options: EnhancedEventOptions = {}
): Event<P> {
  const key = `${event.sid}-runOnce:${options.runOnce ?? false}`;

  const cached = enhancedEventsCache.get(key);
  if (cached) return cached;

  const { runOnce = false } = options;

  const enhancedEvent = createEvent<P>();
  const $called = createStore(false, { sid: `${key}/called` });
  $called.on(event, () => true);

  sample({
    clock: enhancedEvent,
    source: $called,
    filter: (called) => {
      if (runOnce) return !called;
      return true;
    },
    fn: (_, payload) => payload,
    target: event,
  });

  enhancedEventsCache.set(key, enhancedEvent);
  return enhancedEvent;
}

export function usePageEvent(
  event: EmptyOrPageEvent<any, any>,
  options: EnhancedEventOptions = {}
) {
  assertStrict(event);

  const useRouter = readUseRouterHook();
  const router = useRouter();

  // the function has a cache inside, so we can safely call it on every render
  const enhancedEvent = enhancePageEvent(event, options);
  const boundEvent = useUnit(enhancedEvent);

  useEffect(() => {
    const context = ContextNormalizers.router(router);
    boundEvent(context);
  }, [router, boundEvent]);
}

function readUseRouterHook(): typeof NextRouter.useRouter {
  /**
   * CJS-to-ESM interop is cringe :(
   *
   * Since the release of next@12.0.0 ES modules a prioritized over CommonJS modules,
   * so it is most possible that users will have ESM version of nextjs-effector in their bundle
   *
   * But there is no ESM version of next/router yet, so here we are, trying to resolve the cjs/esm interop issues.
   */

  if (NextRouter.useRouter) {
    /**
     * Base case, usually works
     */
    return NextRouter.useRouter;
  }

  // @ts-expect-error
  if (NextRouter.default?.useRouter) {
    /**
     * Weird case, but can happen sometimes with no clear reason.
     */
    // @ts-expect-error
    return NextRouter.default!.useRouter as typeof NextRouter.useRouter;
  }

  throw Error(
    `Something went wrong with resolution of CJS next/router module: Got this '${NextRouter.useRouter}' instead of useRouter hook.
    Please, try to make an reproduce and provide it to 'nextjs-effector' issues
    `
  );
}
