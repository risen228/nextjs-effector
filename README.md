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

You can create two fabrics:

- `createGetInitialProps` (recommended for the most cases)
- `createGetServerSideProps` (usually, used only for edge-cases)

```tsx
/* @app/pages/shared/bindings.ts */

import {
  createAppGetInitialProps,
  createAppGetServerSideProps
} from '@app/shared/lib/effector'
import { appStarted } from './model'

export const createGetInitialProps = createAppGetInitialProps({
  /*
   * "appStarted" will be called only on the server side
   */
  appEvent: appStarted,
})

export const createGetServerSideProps = createAppGetServerSideProps({
  /*
   * "appStarted" will be called on each request (including navigation)
   * In case of GSSP it's just like a shortcut
   */
  appEvent: appStarted,
})
```

After that, you can use it in your pages:

```tsx
/* pages/profile/index.tsx */

import { NextPage } from 'next'
import { MyProfilePage, pageStarted } from '@app/pages/my-profile'
import {
  createGetInitialProps,
  createGetServerSideProps
} from '@app/processes/app'

const Page: NextPage = () => {
  return <MyProfilePage />
}

// Option #1 (recommended)
Page.getInitialProps = createGetInitialProps([pageStarted])

// Option #2 (edge-cases)
export const getServerSideProps = createGetServerSideProps([pageStarted])

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
  appEvent: appStarted,
})
```

Usage:

```tsx
const Page: NextPage = () => {
  return <MyProfilePage />
}

Page.getInitialProps = createGetInitialProps({ pageEvent: pageStarted })

export default Page
```

Core points:

- `appEvent` is executed only on the first request
- On navigation, `pageEvent` is executed on the client-side, without any additional requests

### `createAppGetServerSideProps`

Returns a `getServerSideProps` fabric.

Most likely, you don't need it.

```tsx
export const createGetServerSideProps = createAppGetServerSideProps({
  appEvent: appStarted,
})
```

Usage:

```tsx
const Page: NextPage = () => {
  return <MyProfilePage />
}

export const getServerSideProps = createGetServerSideProps({ pageEvent: pageStarted })

export default Page
```

Core points:

- Both `appEvent` and `pageEvent` are always executed on the server side
- `appEvent` is executed on each request, including the navigation between pages
- On navigation, the target page props are received using server request

## Custom GIP / GSSP

Both `createGetInitialProps` and `createGetServerSideProps` allow to pass a custom fabric as a second argument. It ran after all required events are executed and their `allSettled` promises are fulfilled. Apart from the Effector Scope, you also have an access to the Next.js context, just like in the default GIP / GSSP.

Here you can see the example of the NotFound page implemented using `createGetInitialProps`:

```tsx
/* pages/profile/[id].tsx */

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

### GIP flow

On server side:

1. Take `appEvent` from `createAppGetInitialProps` call arguments
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

1. Take `appEvent` from `createAppGetServerSideProps` call arguments
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

## Why in GSSP the app event are called on each request?

`getServerSideProps`, unlike the `getInitialProps`, is ran only on server-side. The problem is that `pageStarted` logic may depend on global shared data. So, we need either to run `appStarted` on each request (as we do now), or get this global shared data in some other way, for example by sending it back from the client in a serialized form (sounds risky and hard)

Also, to check if `appStarted` event needs to be executed, we need either to ask it from the client, or persist this data on server. The both ways sound hard to implement.

That's why `getInitialProps` is more recommended way to bind your Effector models to Page lifecycle. When navigating between pages, it runs on client side, so we can easily omit the app event execution.

## I need to run appEvent and pageEvent in parallel. How can I do that?

You can create GIP / GSSP fabric without `appEvent`, and define the flow manually:

```tsx
const createGetInitialProps = createAppGetInitialProps()
Page.getInitialProps = createGetInitialProps({ pageEvent: pageStarted })

sample({
  source: pageStarted,
  target: appStarted
})
```
