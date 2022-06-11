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

- `createGetInitialProps` (recommended for the most cases)
- `createGetServerSideProps` (usually, used only for edge-cases)
- `createGetStaticProps` (used for static-generated pages)

```tsx
export const createGetInitialProps = createAppGetInitialProps({
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

export const createGetServerSideProps = createAppGetServerSideProps({
  /*
   * Shared events will be called on each request (including navigation)
   * In case of GSSP it's just like a shortcut
   */
  sharedEvents: [appStarted],
})

export const createGetStaticProps = createAppGetStaticProps({
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
Page.getInitialProps = createGetInitialProps({
  pageEvent: pageStarted
})

// Option #2 (very rare edge-cases)
export const getServerSideProps = createGetServerSideProps({
  pageEvent: pageStarted
})

// Option #3 (static pages)
export const getStaticProps = createGetStaticProps({
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

### `createAppGetInitialProps`

Returns a `getInitialProps` fabric.

```tsx
export const createGetInitialProps = createAppGetInitialProps({
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

Page.getInitialProps = createGetInitialProps({
  /*
   * Unlike "app-level" GIP, on the "page-level" you can speficify the only one page event
   */
  pageEvent: pageStarted
})

export default Page
```

Core points:

- `sharedEvents` are executed only on the first request
- On navigation, `pageEvent` is executed on the client-side, without any additional requests

### `createAppGetServerSideProps`

Returns a `getServerSideProps` fabric.

Most likely, you don't need it.

```tsx
export const createGetServerSideProps = createAppGetServerSideProps({
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

export const getServerSideProps = createGetServerSideProps({
  /*
   * Unlike "app-level" GSSP, on the "page-level" you can speficify the only one page event
   */
  pageEvent: pageStarted
})

export default Page
```

Core points:

- Both `sharedEvents` and `pageEvent` are always executed on the server side
- `sharedEvents` are executed on each request, including the navigation between pages
- On navigation, the target page props are received using server request

### `createAppGetStaticProps`

Returns a `getStaticProps` fabric.

```tsx
export const createGetStaticProps = createAppGetStaticProps({
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

export const getStaticProps = createGetStaticProps({
  /*
   * Unlike "app-level" GSP, on the "page-level" you can speficify the only one page event
   */
  pageEvent: staticPageStarted
})

export default Page
```

Core points:

- `sharedEvents` are executed only on the first request
- On navigation, `pageEvent` is executed on the client-side, without any additional requests

### Experimental `enhancePageEvent`

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

### Experimental `useClientPageEvent`

Calls the provided `PageEvent` with `next/router` context on the client side.

The hook may be useful for the `getStaticProps` cases - it allows to keep Next.js optimization and request some global data at the same time.

You can combine it with `enhancePageEvent` to run the event only once in the application lifecycle.

Usage:

```tsx
const appStartedOnce = enhancePageEvent(appStarted, { runOnce: true })

const Page: NextPage<Props> = () => {
  useClientPageEvent(appStartedOnce)
  return <AboutPage />
}

export const getStaticProps: GetStaticProps<Props> = async () => { /* ... */ }

export default Page
```

## Custom GIP / GSSP

Both `createGetInitialProps` and `createGetServerSideProps` allow to pass a custom fabric as a second argument. It ran after all required events are executed and their `allSettled` promises are fulfilled. Apart from the Effector Scope, you also have an access to the Next.js context, just like in the default GIP / GSSP.

Here you can see the example of the NotFound page implemented using `createGetInitialProps`:

```tsx
interface Props {
  notFound?: boolean
}

const Page: NextPage<Props> = ({ notFound }) => {
  if (notFound) {
    return <NextErrorPage statusCode={404} />
  }

  return <ProfilePage />
}

Page.getInitialProps = createGetInitialProps<Props>({
  pageEvent: pageStarted,
  create(scope) {
    return async ({ res }) => {
      const notFound = scope.getState($userNotFound) === true
      if (notFound && res) res.statusCode = 404
      return { notFound }
    }
  }
})

export default Page
```

## How does it work?

The information may be not actual (it's too hard to update it)

### GIP flow

On server side:

1. Take `sharedEvents` from `createAppGetInitialProps` call arguments
2. Take `pageEvent` from `createGetInitialProps` call arguments
3. Combine them into the single array called `events`
4. Create the Scope by using `fork()`
5. Call the events with `NextPageContext` using `allSettled`
6. Wait for the `allSettled` promises to be fulfilled
7. Instantiate user's GIP (if fabric present) using the Scope
8. Call user's GIP
9. Serialize the Scope and merge it into user's `props`
10. Shared `useScope` logic on App mount:
    1. Create the new Scope using the serialized values
11. Pass the Scope by using `Provider` from `effector-react/scope`
12. Render everything using the provided values
13. Send result to the client side

On client side:

1. Shared `useScope` logic on first App mount:
   1. Create the new Scope from the server-side serialized values
   2. Save it globally and return
2. Pass the Scope by using `Provider` from `effector-react/scope`
3. Render everything using the provided values

On navigation:

1. Take `pageEvent` from `createGetInitialProps` call arguments
2. Get globally saved Scope
3. Call `pageEvent` with `NextPageContext` using `allSettled`
4. Wait for the `allSettled` promise to be fulfilled
5. Serialize the Scope
6. Instantiate user's GIP (if fabric present) using the Scope
7. Call user's GIP
8. Merge serialized values into the GIP result and return it
9. Shared `useScope` logic (required for GSSP compatibility):
   1. Serialize the current Scope
   2. Merge the old values with the new values
   3. Use the merged values to create a new Scope
   4. Save it globally and return
10. Pass the Scope by using `Provider` from `effector-react/scope`
11. Render everything again

### GSSP flow

On server side:

1. Take `sharedEvents` from `createAppGetServerSideProps` call arguments
2. Take `pageEvent` from `createGetServerSideProps` call arguments
3. Create the Scope by using `fork()`
4. Call the events with GSSP Context using `allSettled`
5. Wait for the `allSettled` promises to be fulfilled
6. Instantiate user's GSSP (if fabric present) using the Scope
7. Call user's GSSP
8. Serialize the Scope and merge it into user's `pageProps`
9. Shared `useScope` logic on App mount:
   1. Create the new Scope using the serialized values
10. Pass the Scope by using `Provider` from `effector-react/scope`
11. Render everything using the provided values
12. Send result to the client side

On client side:

1. Shared `useScope` logic on first App mount:
   1. Create the new Scope from the server-side serialized values
   2. Save it globally and return
2. Pass the Scope by using `Provider` from `effector-react/scope`
3. Render everything using the provided values

On navigation:

1. Send GSSP request (done by Next.js)
2. Get the new serialized values from server
3. Shared `useScope` logic:
   1. Serialize the current Scope
   2. Merge the old values with the new values
   3. Use the merged values to create a new Scope
   4. Save it globally and return
4. Pass the Scope by using `Provider` from `effector-react/scope`
5. Render everything again

## Problems

- On user navigation, the entire `App` gets re-rendered, and it may be slow for a big applications. Most likely, you'll need to use `React.memo` to partially solve this problem

## Why in GSSP the app event is called on each request?

`getServerSideProps`, unlike the `getInitialProps`, is ran only on server-side. The problem is that `pageStarted` logic may depend on global shared data. So, we need either to run `appStarted` on each request (as we do now), or get this global shared data in some other way, for example by sending it back from the client in a serialized form (sounds risky and hard)

Also, to check if `appStarted` event needs to be executed, we need either to ask it from the client, or persist this data on server. The both ways sound hard to implement.

That's why `getInitialProps` is more recommended way to bind your Effector models to Page lifecycle. When navigating between pages, it runs on client side, so we can easily omit the app event execution.

## I need to run sharedEvents and pageEvent in parallel. How can I do that?

You can create GIP / GSSP fabric without `sharedEvents`, and define the flow manually:

```tsx
const createGetInitialProps = createAppGetInitialProps()

Page.getInitialProps = createGetInitialProps({
  pageEvent: pageStarted
})

sample({
  source: pageStarted,
  target: appStarted
})
```

Also, you can use `enhancePageEvent` to run specific events only once in the application lifecycle.
