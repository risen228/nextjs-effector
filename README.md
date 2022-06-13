## Installation

Currently, this is not published in NPM (I'm working on it)

## Usage

### Before you start

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

After that, your application will be wrapped in Effector's Scope Provider. The `withEffector` function uses

## Usage concept

At first, you need the `effector/babel-plugin`:

```json
{
  "presets": ["next/babel"],
  "plugins": [["effector/babel-plugin", { "reactSsr": true }]]
}
```

By doing that, all our Effector units will be created with unique `sid` constant, so we can safely serialize them for sending to the client. `reactSsr` option is used to replace all `effector-react` imports with `effector-react/scope` version to ensure that `useStore`, `useEvent`, and the other hooks respect the scope that was passed using `Provider`.

The second thing you need to do is to enhance your `App` by using `withEffector` HOC:

```tsx
/* pages/_app.tsx */

import App from 'next/app'
import { withEffector } from '@app/shared/lib/effector'

export default withEffector(App)
```

Next, you need to bind your pages Effector events to Next.js lifecycle.

Assume we have the following Effector events:

- `appStarted` - an event that starts loading the global shared data: user profile, session, and so on
- `pageStarted` - an event that starts loading data for the specific page

```tsx
import { PageContext, StaticPageContext } from '@app/shared/lib/effector'

export const appStarted = createEvent<PageContext>()
export const pageStarted = createEvent<PageContext>()

// Also, you can use "StaticPageContext" for static pages events
export const staticAppStarted = createEvent<StaticPageContext>()
export const staticPageStarted = createEvent<StaticPageContext>()
```

You can create three fabrics:

- `createGIP` (recommended for the most cases)
- `createGSSP` (usually, used only for edge-cases)
- `createGSP` (used for static-generated pages)

```tsx
export const createGIP = createGIPFactory({
  /*
   * Shared events will be called only on the server side
   */
  sharedEvents: [appStarted],

  /*
   * By default, shared events are executed only once in the application lifecycle
   * You can disable it by passing "false" in "runSharedOnce" option
   * In that case, shared events will run on each navigation to page that uses them
   */
  runSharedOnce: false
})

export const createGSSP = createGSSPFactory({
  /*
   * Shared events will be called on each request (including navigation)
   * In case of GSSP it's just like a shortcut
   */
  sharedEvents: [appStarted],
})

export const createGSP = createGSPFactory({
  /*
   * Shared events will be called on each static page creation
   */
  sharedEvents: [staticAppStarted],
})
```

After that, you can use it in your pages:

```tsx
const Page: NextPage = () => {
  return <MyProfilePage />
}

// Option #1 (recommended)
Page.getInitialProps = createGIP({
  pageEvent: pageStarted
})

// Option #2 (very rare edge-cases)
export const getServerSideProps = createGSSP({
  pageEvent: pageStarted
})

// Option #3 (static pages)
export const getStaticProps = createGSP({
  pageEvent: staticPageStarted
})

export default Page
```

## API

### `withEffector`

Wraps your `App` with Effector Scope `Provider`.

The Scope is created using the serialized values from GIP or GSSP.

```tsx
export default withEffector(App)
```

### `createGIPFactory`

Returns a `getInitialProps` fabric.

```tsx
export const createGIP = createGIPFactory({
  /*
   * Shared events will be called only on the server side
   */
  sharedEvents: [appStarted],

  /*
   * By default, shared events are executed only once in the application lifecycle
   * You can disable it by passing "false" in "runSharedOnce" option
   * In that case, shared events will run on each navigation to page that uses them
   */
  runSharedOnce: false
})
```

Usage:

```tsx
const Page: NextPage = () => {
  return <MyProfilePage />
}

Page.getInitialProps = createGIP({
  /*
   * Unlike "app-level" GIP, here you can speficify the only one page event
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

export default Page
```

Core points:

- `sharedEvents` are executed only on the first request
- On navigation, `pageEvent` is executed on the client-side, without any additional requests

### `createGSSPFactory`

Returns a `getServerSideProps` fabric.

Most likely, you don't need it.

```tsx
export const createGSSP = createGSSPFactory({
  /*
   * Shared events will be called on each request (including navigation)
   * In case of GSSP it's just like a shortcut
   */
  sharedEvents: [appStarted],
})
```

Usage:

```tsx
const Page: NextPage = () => {
  return <MyProfilePage />
}

export const getServerSideProps = createGSSP({
  /*
   * Unlike "app-level" GSSP, here you can speficify the only one page event
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

export default Page
```

Core points:

- Both `sharedEvents` and `pageEvent` are always executed on the server side
- `sharedEvents` are executed on each request, including the navigation between pages
- On navigation, the target page props are received using server request

### `createGSPFactory`

Returns a `getStaticProps` fabric.

```tsx
export const createGSP = createGSPFactory({
  /*
   * Shared events will be called on each static page generation
   */
  sharedEvents: [staticAppStarted],
})
```

Usage:

```tsx
const Page: NextPage = () => {
  return <MyProfilePage />
}

export const getStaticProps = createGSP({
  /*
   * Unlike "app-level" GSP, on the "page-level" you can speficify the only one page event
   */
  pageEvent: staticPageStarted,

  /*
   * You can define your custom logic using "customize" function
   * It's run after all events are settled and Scope is ready to be serialized
   */
  customize({ scope, context }) {
    return { /* GSP Result */ }
  }
})

export default Page
```

Core points:

- `sharedEvents` are executed only on the first request
- On navigation, `pageEvent` is executed on the client-side, without any additional requests

### `enhancePageEvent`

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

### `usePageEvent`

Calls the provided `PageEvent` on the client side.

The hook may be useful for the `getStaticProps` cases - it allows to keep Next.js optimization and request some user-specific global data at the same time.

The second parameter is [options to enhance](#enhancepageevent) the event using `enhancePageEvent`.

Usage:

```tsx
const Page: NextPage<Props> = () => {
  usePageEvent(appStarted, { runOnce: true })
  return <AboutPage />
}

export const getStaticProps: GetStaticProps<Props> = async () => { /* ... */ }

export default Page
```

## Why in GSSP the shared events are called on each request?

`getServerSideProps`, unlike the `getInitialProps`, is run only on server-side. The problem is that `pageEvent` logic may depend on global shared data. So, we need either to run shared events on each request (as we do now), or get this global shared data in some other way, for example by sending it back from the client in a serialized form (sounds risky and hard).

Also, to check if shared events are need to be executed, we should either to ask it from the client, or persist this data on server. The both ways sound hard to implement.

That's why `getInitialProps` is more recommended way to bind your Effector models to Page lifecycle. When navigating between pages, it runs on client side, so we can easily omit the app event execution.

## I need to run sharedEvents and pageEvent in parallel. How can I do that?

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
