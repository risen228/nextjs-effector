## Navigation

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  - [Initial setup](#initial-setup)
  - [Main Concepts](#main-concepts)
  - [Factories](#factories)
    - [`getInitialProps`](#getinitialprops-server-and-client-side)
    - [`getServerSideProps`](#getserversideprops-only-server-side)
    - [`getStaticProps`](#getstaticprops-only-server-side)
  - [Advanced Page Events Usage](#advanced-page-events-usage)
    - [`usePageEvent`](#usepageevent-only-client-side)
    - [`enhancePageEvent`](#enhancepageevent-manual-flow-control)
- [Recipes](#recipes)
  - [Cookies](#cookies)
- [Common Questions](#common-questions)
- [Contrubuting](#contributing)
- [Maintenance](#maintenance)
  - [Regular flow](#regular-flow)
  - [Prerelease from](#prerelease-flow)
  - [Conventions](#conventions)

## Installation

```sh
yarn add nextjs-effector @effector/next effector-react effector
```

## Usage

### Initial setup

At first, add `effector/babel-plugin` to your `.babelrc`:

```json
{
  "presets": ["next/babel"],
  "plugins": ["effector/babel-plugin"]
}
```

By doing that, all our Effector units will be created with `sid` constant, which is unique and stable between the server and the client, so we can safely serialize store values for sending to the client.

You can also try out [the official `@effector/swc-plugin`](https://github.com/effector/swc-plugin), which is still in early beta as the whole SWC-plugins system itself.

Finally, enhance your `App`:

```tsx
/* pages/_app.tsx */

import App from "next/app";
import { withEffector } from "nextjs-effector";

// Passing effector-react exports is required to access the Scope
export default withEffector(App);
```

After that, the `App` will be wrapped in Effector's Scope Provider. The `withEffector` function uses `@effector/next` under the hood, which handles all of Next.js caveats and special requirements for us. This way you can focus on the writing a business logic without thinking about problems of integrating Effector into your Next.js application.

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
export const loadAuthenticatedUser = createEvent();
export const loadTranslations = createEvent();

/* Needed only on the post page */
export const loadPostCategories = createEvent();
export const loadPostContent = createEvent();
```

Let's group them into **shared** and **specific**:

```tsx
export const appStarted = createEvent();
export const postPageStarted = createEvent();

sample({
  clock: appStarted,
  target: [loadAuthenticatedUser, loadTranslations],
});

sample({
  clock: postPageStarted,
  target: [loadPostCategories, loadPostContent],
});
```

We want the `appStarted` to be called once in application lifecycle, and the `postPageStarted` to be called on requesting / navigating to Post page. `nextjs-effector` library provides a 2-level GIP factory to cover this case:

```tsx
export const createGIP = createGIPFactory({
  // Will be called once
  sharedEvents: [appStarted],
});

PostPage.getInitialProps = createGIP({
  // Will be called on visiting PostPage
  pageEvent: postPageStarted,
});
```

Also, the library provides `createGSSPFactory` for `getServerSideProps` and `createGSPFactory` for `getStaticProps`. They have almost the same API, but both of them run `sharedEvents` on each request / static page generation.

### Factories

#### `getInitialProps` (runs both at server and client side)

https://nextjs.org/docs/api-reference/data-fetching/get-initial-props

```tsx
/*
 * 1. Create events
 * GIP accepts the events with "PageContext" or "void" payload types
 */
export const appStarted = createEvent();
export const appStarted = createEvent<PageContext>();
export const pageStarted = createEvent();
export const pageStarted = createEvent<PageContext>();
export const pageStarted = createEvent<PageContext<Props, Params, Query>>();

/*
 * 2. Create GIP factory
 * The place depends on your architecture
 */
export const createGIP = createGIPFactory({
  // Will be called once:
  // - Server side on initial load
  // - Client side on navigation (only if not called yet)
  sharedEvents: [appStarted],

  // Allows to specify shared events behavior
  // When "false", the shared events run like pageEvent
  runSharedOnce: true,

  // Allows to customize server-side Scope creation process
  // By default, the library just uses fork(), like below
  // But you can fill the stores in scope with your values (cookies, for example)
  createServerScope: () => fork(),
});

/*
 * 3. Create GIP
 * Usually, it's done inside "pages" directory
 */
Page.getInitialProps = createGIP({
  // Will be called on each page visit:
  // - Server side on initial load
  // - Client side on navigation (even if already called)
  pageEvent: pageStarted,

  // You can define your custom logic using "customize" function
  // It's run after all events are settled, but before Scope serialization
  // So, here you can safely call allSettled
  async customize({ scope, context }) {
    return {
      /* Props */
    };
  },
});
```

#### `getServerSideProps` (runs only at server side)

https://nextjs.org/docs/api-reference/data-fetching/get-server-side-props

```tsx
/*
 * 1. Create events
 * GSSP accepts the events with "PageContext" or "void" payload types
 */
export const appStarted = createEvent();
export const appStarted = createEvent<PageContext>();
export const pageStarted = createEvent();
export const pageStarted = createEvent<PageContext>();
export const pageStarted = createEvent<PageContext<Props, Params, Query>>();

/*
 * 2. Create GSSP factory
 * The place depends on your architecture
 */
export const createGSSP = createGSSPFactory({
  // Will be called on first request and on each page navigation (always on server side)
  sharedEvents: [appStarted],
});

/*
 * 3. Create GSSP
 * Usually, it's done inside "pages" directory
 */
export const getServerSideProps = createGSSP({
  // Will be called on each page navigation (always on server side)
  // Always called after shared events
  pageEvent: pageStarted,

  // You can define your custom logic using "customize" function
  // It's run after all events are settled, but before Scope serialization
  // So, here you can safely call allSettled
  customize({ scope, context }) {
    return {
      /* GSSP Result */
    };
  },
});
```

#### `getStaticProps` (runs only at server side)

https://nextjs.org/docs/api-reference/data-fetching/get-static-props

```tsx
/*
 * 1. Create events
 */
export const appStarted = createEvent();
export const appStarted = createEvent<StaticPageContext>();
export const pageStarted = createEvent();
export const pageStarted = createEvent<StaticPageContext>();
export const pageStarted = createEvent<StaticPageContext<Props, Params>>();

/*
 * 2. Create GSP factory
 * The place depends on your architecture
 */
export const createGSP = createGSPFactory({
  // Will be called on each page generation (always on server side)
  sharedEvents: [appStarted],
});

/*
 * 3. Create GSP
 * Usually, it's done inside "pages" directory
 */
export const getStaticProps = createGSP({
  // Will be called on each page generation (always on server side)
  pageEvent: pageStarted,

  // You can define your custom logic using "customize" function
  // It's run after all events are settled, but before Scope serialization
  // So, here you can safely call allSettled
  customize({ scope, context }) {
    return {
      /* GSP Result */
    };
  },
});
```

### Advanced Page Events Usage

#### `usePageEvent` (useful on client side)

Executes the provided `Event<void> | Event<PageContext>` on the client side.

The hook may be useful for the `getStaticProps` cases - it allows to keep Next.js optimization and request some user-specific global data at the same time.

The second parameter is [options to enhance](#enhancepageevent-manual-flow-control) the event using `enhancePageEvent`.

Usage:

```tsx
const Page: NextPage<Props> = () => {
  usePageEvent(appStarted, { runOnce: true });
  return <AboutPage />;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  /* ... */
};

export default Page;
```

#### `enhancePageEvent` (manual flow control)

Wraps your event and adds some logic to it.

The enhanced event can be safely used anywhere.

It doesn't cause any changes to the original event - you may use it just as before.

```tsx
const enhancedEvent = enhancePageEvent(appStarted, {
  // Works like the "runSharedOnce" option in GIP fabric, but for the single event
  // This option applies to both client and server environments:
  // If the enhanced event was called on the server side, it won't be called on the client side
  runOnce: true,
});
```

#### Utility functions

```tsx
/*
 * PageContext has the "env" field with "client" or "server" value,
 * so you can determine the environment where the code is executed
 *
 * The library provides useful types and type-guards for these purposes
 */
import {
  isClientPageContext,
  isServerPageContext,
  ClientPageContext,
  ServerPageContext
} from 'nextjs-effector'

const pageStartedOnClient = createEvent<ClientPageContext>()
const pageStartedOnServer = createEvent<ServerPageContext>()

sample({
  source: pageStarted,
  filter: isClientPageContext,
  target: pageStartedOnClient
})

sample({
  source: pageStarted,
  filter: isServerPageContext,
  target: pageStartedOnServer
})

sample({
  source: pageStartedOnServer,
  fn: (context) => {
    // You can access "req" and "res" on server side
    const { req, res } = context
    return req.cookie
  }
})

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

## Recipes

### Cookies

You can use `createServerScope` to set cookies before executing any logic:

```ts
export const createGIP = createGIPFactory({
  sharedEvents: [appStarted],
  createServerScope: (context) => {
    return fork({
      values: [[$cookies, context.req?.headers.cookie ?? ""]],
    });
  },
});
```

Also, you can access `req` object in effector logic by using `isServerContext`

```ts
import { isServerPageContext } from "nextjs-effector";

sample({
  source: appStarted,
  filter: isServerPageContext,
  fn: (context) => context.req.cookie,
  target: $cookies,
});
```

## Common Questions

### Where should I call createGIPFactory / createGSSPFactory / createGSPFactory?

The place depends on your architecture. But one thing is certain - **creating factories on each page is a really bad idea**. They are designed to simplify and encapsulate the repeated logic parts.

For example, with [`Feature Sliced Design`](https://feature-sliced.design) you might consider creating `layouts` layer, which can be used to create reusable page layouts and factories.

### I need to run sharedEvents and pageEvent in parallel. How can I do that?

You can create GIP / GSSP fabric without `sharedEvents`, and define the flow manually:

```tsx
const createGIP = createGIPFactory();

Page.getInitialProps = createGIP({
  pageEvent: pageStarted,
});

sample({
  source: pageStarted,
  target: appStarted,
});
```

Also, you can use `enhancePageEvent` to run specific events only once in the application lifecycle.

### What do i do if there are bundling issues?

Since Next.js 12 ESM imports are prioritized over CommonJS imports. While CJS-only dependencies are still supported, it is not recommended to use them, as those can lead to library doubles in the bundle and really weird bugs.

You can read about it [here](https://github.com/effector/next#esm-dependencies-and-library-duplicates-in-the-bundle)

In case if there is a CommonJS-only dependency, which uses effector and you absouletly need it and author can't fix it - you can copy the library to your project as the *last resort measure*.

#### How to

1. [Download repository](https://github.com/risenforces/nextjs-effector/archive/refs/heads/release/latest.zip)
2. Copy `library` folder contents into your project, for example into `src/nextjs-effector`
3. Create the alias using tsconfig.json:

   ```json
   {
     "compilerOptions": {
       "baseUrl": "./",
       "paths": {
         "nextjs-effector": ["./src/nextjs-effector"],
         "nextjs-effector/*": ["./src/nextjs-effector/*"]
       }
     }
   }
   ```

## Contributing

1. Fork this repo
2. Use the [Regular flow](#regular-flow)

Please follow [Conventions](#conventions)

## Maintenance

The dev branch is `main` - any developer changes is merged in there.

Also, there is a `release/latest` branch. It always contains the actual source code for release published with `latest` tag.

All changes is made using Pull Requests - push is forbidden. PR can be merged only after successfull `test-and-build` workflow checks.

When PR is merged, `release-drafter` workflow creates/updates a draft release. The changelog is built from the merged branch scope (`feat`, `fix`, etc) and PR title. When release is ready - we publish the draft.

Then, the `release` workflow handles everything:

- It runs tests, builds a package, and publishes it
- It synchronizes released tag with `release/latest` branch

### Regular flow

1. Create [feature branch](#conventions)
2. Make changes in your feature branch and [commit](#conventions)
3. Create a Pull Request from your feature branch to `main`  
   The PR is needed to test the code before pushing to release branch
4. If your PR contains breaking changes, don't forget to put a `BREAKING CHANGES` label
5. Merge the PR in `main`
6. All done! Now you have a drafted release - just publish it when ready

### Prerelease flow

1. Assume your prerelease tag is `beta`
2. Create `release/beta` branch
3. Create [feature branch](#conventions)
4. Make changes in your feature branch and [commit](#conventions)
5. Create a Pull Request from your feature branch to `release/beta`  
   The PR is needed to test the code before pushing to release branch
6. Create Github release with tag like `v1.0.0-beta`, pointing to `release/beta` branch  
   For next `beta` versions use semver build syntax: `v1.0.0-beta+1`
7. After that, the `release` workflow will publish your package with the `beta` tag
8. When the `beta` version is ready to become `latest` - create a Pull Request from `release/beta` to `main` branch
9. Continue from the [Regular flow's](#regular-flow) #5 step

### Conventions

**Feature branches**:

- Should start with `feat/`, `fix/`, `docs/`, `refactor/`, and etc., depending on the changes you want to propose (see [pr-labeler.yml](./.github/pr-labeler.yml) for a full list of scopes)

**Commits**:

- Should follow the [Conventional Commits specification](https://www.conventionalcommits.org)

**Pull requests**:

- Should have human-readable name, for example: "Add a TODO list feature"
- Should describe changes
- Should have correct labels
