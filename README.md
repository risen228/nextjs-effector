## Navigation

- [Installation](#installation)
- [Usage](#usage)
  - [Initial setup](#initial-setup)
  - [Main Concepts](#main-concepts)
  - [`getInitialProps`](#getinitialprops-server-and-client-side)
  - [`getStaticProps`](#getstaticprops-only-server-side)
  - [`getServerSideProps`](#getserversideprops-only-server-side)
  - [`usePageEvent`](#usepageevent-only-client-side)
  - [`enhancePageEvent`](#enhancepageevent-manual-flow-control)
- [Common Questions](#common-questions)

## Installation

Currently, this is not published in NPM (I'm working on it)

## Usage

### Initial setup

At first, add `effector/babel-plugin` to your `.babelrc`:

```json
{
  "presets": ["next/babel"],
  "plugins": [["effector/babel-plugin", { "reactSsr": true }]]
}
```

By doing that, all our Effector units will be created with unique `sid` constant, so we can safely serialize them for sending to the client.

The `reactSsr` option is used to replace all `effector-react` imports with `effector-react/scope` version to ensure that `useStore`, `useEvent`, and the other hooks use the scope that was passed using `Provider`.

Next, enhance your `App`:

```tsx
/* pages/_app.tsx */

import App from 'next/app'
import { withEffector } from '@app/shared/lib/effector'

export default withEffector(App)
```

After that, the `App` will be wrapped in Effector's Scope Provider. `withEffector` function uses the smart Scope management logic under the hood, so you can focus on the writing a business logic without thinking about problems of integrating Effector into your Next.js application.

### Main Concepts

Basically, there are 2 types of data in any application:

- **Shared** - used in almost every page (translations, logged user info)
- **Specific** - used only in the relevant pages (post content on post page, group info on group page)

Usually, we want these conditions to be met:

- The **shared** data is loaded once in the application lifecycle (expect for manual update)
- The **specific** data is loaded on each navigation between the pages
- No **shared** events boilerplate on every page

Assume we have the following Effector events:

```tsx
/* Needed everywhere */
export const loadAuthenticatedUser = createEvent()
export const loadTranslations = createEvent()

/* Needed only on the post page */
export const loadPostCategories = createEvent()
export const loadPostContent = createEvent()
```

Let's group them into **shared** and **specific**:

```tsx
export const appStarted = createEvent()
export const postPageStarted = createEvent()

sample({
  clock: appStarted,
  target: [loadAuthenticatedUser, loadTranslations]
})

sample({
  clock: postPageStarted,
  target: [loadPostCategories, loadPostContent]
})
```

We want the `appStarted` to be called once in application lifecycle, and the `postPageStarted` to be called on requesting / navigating to Post page. `nextjs-effector` library provides a 2-level GIP factory to cover this case:

```tsx
export const createGIP = createGIPFactory({
  // Will be called once
  sharedEvents: [appStarted]
})

PostPage.getInitialProps = createGIP({
  // Will be called on visiting PostPage
  pageEvent: postPageStarted
})
```

Also, the library provides `createGSSPFactory` for `getServerSideProps` and `createGSPFactory` for `getStaticProps`. They have almost the same API, but both of them run `sharedEvents` on each request / static page generation.

The events accept the page context as payload:

```tsx
/*
 * Both GIP and GSSP accept the events with "PageContext | void" payload
 */
export const appStarted = createEvent<PageContext>()
export const pageStarted = createEvent<PageContext>()
export const pageStarted = createEvent<PageContext<Props, Params, Query>>()

/*
 * GSP accepts the events with "StaticPageContext | void" payload
 * Unlike PageContext, the StaticPageContext doesn't include query
 * and some other properties
 */
export const appStarted = createEvent<StaticPageContext>()
export const pageStarted = createEvent<StaticPageContext>()
export const pageStarted = createEvent<StaticPageContext<Props, Params>>()

/*
 * Also, the library exports some utility types
 */
type PageEvent<...> = Event<PageContext<...>>
type StaticPageEvent<...> = Event<StaticPageContext<...>>
type EmptyOrPageEvent<...> = PageEvent<...> | Event<void>
type EmptyOrStaticPageEvent<...> = StaticPageEvent<...> | Event<void>
```

### `getInitialProps` (server and client side)

Although `getServerSideProps` is the most modern approach, we strongly recommend to use `getInitialProps` in most cases with Effector.

```tsx
/*
 * 1. Create events
 */
export const appStarted = createEvent()
export const appStarted = createEvent<PageContext>()
export const pageStarted = createEvent()
export const pageStarted = createEvent<PageContext>()
export const pageStarted = createEvent<PageContext<Props, Params, Query>>()

/*
 * 2. Create GIP factory
 * The place depends on your architecture
 */
export const createGIP = createGIPFactory({
  /*
   * Will be called once:
   * - Server side on initial load
   * - Client side on navigation (only if not called yet)
   */
  sharedEvents: [appStarted],

  /*
   * Allows to specify shared events behavior
   * When "false", the shared events run like pageEvent
   */
  runSharedOnce: true
})

/*
 * 3. Create GIP
 * Usually, it's done inside "pages" directory
 */
Page.getInitialProps = createGIP({
  /*
   * Will be called on each page visit:
   * - Server side on initial load
   * - Client side on navigation (even if already called)
   */
  pageEvent: pageStarted,

  /*
   * You can define your custom logic using "customize" function
   * It's run after all events are settled and Scope is ready to be serialized
   */
  customize({ scope, context }) {
    return { /* Props */ }
  }
})
```

### `getStaticProps` (only server side)

Recommended for static pages.

```tsx
/*
 * 1. Create events
 */
export const appStarted = createEvent()
export const appStarted = createEvent<StaticPageContext>()
export const pageStarted = createEvent()
export const pageStarted = createEvent<StaticPageContext>()
export const pageStarted = createEvent<StaticPageContext<Props, Params>>()

/*
 * 2. Create GSP factory
 * The place depends on your architecture
 */
export const createGSP = createGSPFactory({
  /*
   * Will be called on each page generation (always server side)
   */
  sharedEvents: [appStarted],
})

/*
 * 3. Create GSP
 * Usually, it's done inside "pages" directory
 */
export const getStaticProps = createGSP({
  /*
   * Will be called on each page generation (always server side)
   */
  pageEvent: pageStarted,

  /*
   * You can define your custom logic using "customize" function
   * It's run after all events are settled and Scope is ready to be serialized
   */
  customize({ scope, context }) {
    return { /* GSP Result */ }
  }
})
```

### `getServerSideProps` (only server side)

> **Warning**  
> `getServerSideProps` is not recommended with Effector

```tsx
/*
 * 1. Create events
 */
export const appStarted = createEvent()
export const appStarted = createEvent<PageContext>()
export const pageStarted = createEvent()
export const pageStarted = createEvent<PageContext>()
export const pageStarted = createEvent<PageContext<Props, Params, Query>>()

/*
 * 2. Create GSSP factory
 * The place depends on your architecture
 */
export const createGSSP = createGSSPFactory({
  /*
   * Will be called on each page visit (always server side)
   */
  sharedEvents: [appStarted],
})

/*
 * 3. Create GSSP
 * Usually, it's done inside "pages" directory
 */
export const getServerSideProps = createGSSP({
  /*
   * Will be called on each page visit (always server side)
   */
  pageEvent: pageStarted,

  /*
   * You can define your custom logic using "customize" function
   * It's run after all events are settled and Scope is ready to be serialized
   */
  customize({ scope, context }) {
    return { /* GSSP Result */ }
  }
})
```

### `usePageEvent` (only client side)

Calls the provided `Event<void> | Event<PageContext>` on the client side.

The hook may be useful for the `getStaticProps` cases - it allows to keep Next.js optimization and request some user-specific global data at the same time.

The second parameter is [options to enhance](#enhancepageevent-manual-flow-control) the event using `enhancePageEvent`.

Usage:

```tsx
const Page: NextPage<Props> = () => {
  usePageEvent(appStarted, { runOnce: true })
  return <AboutPage />
}

export const getStaticProps: GetStaticProps<Props> = async () => { /* ... */ }

export default Page
```

### `enhancePageEvent` (manual flow control)

Wraps your event and adds some logic to it.

The enhanced event can be safely used anywhere.

It doesn't cause any changes to the original event - you may use it just as before.

```tsx
const enhanced = enhancePageEvent(appStarted, {
  /*
   * Works like the "runSharedOnce" option in GIP fabric, but for the single event
   * This option applies to both client and server environments:
   * If the enhanced event was called on the server side, it won't be called on the client side
   */
  runOnce: true
})
```

## Common Questions

### Why in GSSP the shared events are called on each request?

`getServerSideProps`, unlike the `getInitialProps`, is run only on server-side. The problem is that `pageEvent` logic may depend on global shared data. So, we need either to run shared events on each request (as we do now), or get this global shared data in some other way, for example by sending it back from the client in a serialized form (sounds risky and hard).

Also, to check if shared events are need to be executed, we should either to ask it from the client, or persist this data on server. The both ways sound hard to implement.

That's why `getInitialProps` is more recommended way to bind your Effector models to Page lifecycle. When navigating between pages, it runs on client side, so we can easily omit the app event execution.

### I need to run sharedEvents and pageEvent in parallel. How can I do that?

You can create GIP / GSSP fabric without `sharedEvents`, and define the flow manually:

```tsx
const createGIP = createGIPFactory()

Page.getInitialProps = createGIP({
  pageEvent: pageStarted
})

sample({
  source: pageStarted,
  target: appStarted
})
```

Also, you can use `enhancePageEvent` to run specific events only once in the application lifecycle.
