## Usage concept

At first, you need the `effector/babel-plugin`:

```json
{
  "presets": ["next/babel"],
  "plugins": [["effector/babel-plugin", { "reactSsr": true }]]
}
```

By doing that, all our Effector units will be created with unique `sid` constant, so we can safely serialize them for sending to the client. `reactSsr` option is used to replace all `effector-react` imports with `effector-react/scope` version to ensure that `useStore`, `useEvent`, and the other hooks respect the scope that was passed using `Provider`.

The second thing you need to do is to enhance your `App` using `withEffector` HOC:

```tsx
/* pages/_app.tsx */

import App from 'next/app'
import { withEffector } from '@app/shared/lib/effector'

export default withEffector(App)
```

Next, assume we have the following Effector events:

- `appStarted` - an event that starts loading the global shared data: user profile, session, and so on

- `pageStarted` - an event that starts loading data for the specific page

The second thing you need to do is to create a `getServerSideProps` fabric:

```tsx
/* @app/processes/app/gssp.ts */

import { createAppGSSP } from '@app/shared/lib/effector'
import { appStarted } from './model'

export const createGSSP = createAppGSSP({
  /*
   * Here, pass "appStarted" inside
   * It will be called on server-side when user requests any page
   * (including the navigation between pages)
   * We talk about it later
   */
  globalEvents: [appStarted],
})
```

After that, you can use `createGSSP` in your pages:

```tsx
/* pages/profile/index.tsx */

import { NextPage } from 'next'
import { MyProfilePage, pageStarted } from '@app/pages/my-profile'
import { createGSSP } from '@app/processes/app'

/*
 * Here, pass "pageStarted" inside
 * It will be called on server-side when user requests this page
 * (including the navigation between pages)
 */
export const getServerSideProps = createGSSP([pageStarted])

const Page: NextPage = () => {
  return <MyProfilePage />
}

export default Page
```

Ideally, we want to load the shared data only once, but there are some problems that I didn't solve yet:

- To check if `appStarted` event needs to be executed, we need either to ask it from the client, or persist this data on server. The both ways sound hard to implement.
- `getServerSideProps`, unlike the `getInitialProps`, is ran only on server-side. The problem is that `pageStarted` logic may depend on global shared data. So, we need either to run `appStarted` on each request (as we do now), or get this global shared data in some other way, for example by sending it back from the client in a serialized form (sounds risky and hard)

## How does it work?

On server side:

1. Take `globalEvents` from `createAppGSSP` call arguments
2. Take `pageEvents` from `createGSSP` call arguments
3. Combine them into the single array called `events`
4. Create the Scope by using `fork()`
5. Call the events with GSSP Context using `allSettled`
6. Wait for the `allSettled` promises to be fulfilled
7. Serialize the Scope and save it inside `pageProps`
8. On `App` mount, create the new Scope by using the serialized values
9. Pass the Scope by using `Provider` from `effector-react/scope`
10. Render everything using provided values
11. Send result to the client side

On client side:

1. On first `App` mount, create the new Scope from the server-side serialized values
2. Pass the Scope by using `Provider` from `effector-react/scope`
3. Render everything using provided values
4. On user navigation, get the new serialized values from server
5. Serialize the current Scope, merge the old values with the new values
6. Use the merged values to create a new Scope
7. Pass the Scope by using `Provider` from `effector-react/scope`
8. Render everything again

Problems:

- On user navigation, the `App` gets re-rendered, it may be very slow for a big applications. Most likely, you'll need to use `React.memo` to partially solve this problem
- On user navigation, we go through some `serialize` / `fork` steps, that may be a little slow. On the other side, `hydrate` is much slower and has some other drawbacks, so actually the solution we're using is not the worst