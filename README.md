Capacitor Viability Test

# The problem

1. SEO, general user experience, and >CURRENT YEAR requires we have static or SSR content ready to serve (a la html per page)
2. Capacitor requires we sync a static bundle (a la html per the entire website) to construct a native build
3. It would be _nice_ to be able to access RSC functionality

- The only configuration of next app that supports a static bundle is the [Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Dynamic Route Segments](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes) are critical, non-negotiable, literally-the-definition-of-content functionality
- Static Exports can have two options for handling Dynamic Route Segments; a) Generating Static Params, and b) Client Components
  - a) [Generating Static Params](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes#generating-static-params) is simple; it builds static html pages for your site for the exhaustive set of pages that you were able to fetch and generate at the time of your build; then fall back to [dynamic rendering](https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic-rendering#dynamic-rendering) for valid routes that don't exist after build time but should exist at request time. This dynamic fallback requires a server (no html per the entire website, failing 2.)
  - b) [Client Components](https://nextjs.org/docs/app/building-your-application/deploying/static-exports#dynamic-fetching-with-client-components) (once [this bug](https://github.com/vercel/next.js/issues/49059) is resolved) can do all of the fetching work on the client side, require no server, but don't produce any meaningful static content for your sites content (no html per page, failing 1.)

<!--
  | Web           | Native        | Problems                                                                                        |
  | ------------- | ------------- | ----------------------------------------------------------------------------------------------- |
  | SSR           | SSR           | Capacitor has no static site to sync                                                            |
  | SSR           | Static Export | Every data driven part of the app will need client side fetching UI and conditional composition |
  | Static Export | Static Export | Web can't support ISR                                                                           |
 -->

# Half-beans with Web(SSG + ISR) & Native(Client-Side)

## Executive Summary

- Almost everything will be `use client`
- Using `app Dir` just to be ready for future possibility
- Build all of our data fetch functions in isolated files
- Build loading and error components in separate files
- Do 100% of data fetching client-side using something like `tanstack`
- Export `generateStaticParams` conditionally for web builds - result is a fully static generated site 🚨 HOW WILL FALLBACK WORK
- Re-build site daily to ensure fresh static cache
- Do not export `generateStaticParams` for native build - result is a fully static but stubbed dynamic SPA-like site

## Requirements

1. We only have to write it all as an SPA style client app (Capacitor ready, 100% client-side query), and
2. We have the ability to export to a static bundle for SEO

## Thesis

1. Straight up just `useQuery` that mf
2. We enable the static build _and_ conditionally export `generateStaticParams`/`getStaticPaths` to force it to generate all of the dynamic pages at build time. This begs the question, how will we handle SEO for new content/updated content; is the answer simply, "run the build often enough"?

We will need a better understanding of [generateStaticParams](https://beta.nextjs.org/docs/api-reference/generate-static-params) and the [Metatdata API](https://beta.nextjs.org/docs/api-reference/metadata) to wrap this all the way up

### Metadata API

> When rendering a route, Next.js will automatically deduplicate fetch requests for the same data across generateMetadata, generateStaticParams, Layouts, Pages, and Server Components. React cache can be used if fetch is unavailable.

We might need to find a way to integrate the Next `fetch` into our query client? does it even matter if we are static generating... like do we even bother deduplicating right now or just cop the `2N+M` requests; `N=number recipes` and `M=getting all recipe IDs`

### Incremental Static Regeneration (a.k.a fallback)

> The following additional dynamic features are not supported with a static export: Incremental Static Regeneration

This kills the crab 🦀 How will we allow a new recipe to be created and then appear on the website; in any capacity both in terms of listings and in terms of new page(s) being created/handled.

## Theory

```tsx
// config.ts
const isWeb = process.env.BUILD_CONTEXT === 'web';

// fetchFooData.ts
async function fetchFooData(id) {
  return {
    // ...
  };
}

// FooScreen.tsx
export function FooScreen({ id, data }) {
  const { data, isLoading, error } = useQuery(['foo', id], fetchFooData);
  if (isLoading) {
    return <>Loading... ⏳</>;
  }
  if (error) {
    return <>Error! 🤦‍♀️</>;
  }
  return (
    <div>
      <h1>{data.title}</h1>
      <form>
        <button>Thanks!</button>
      </form>
    </div>
  );
}

// getStaticParamsFoo.ts
export async function getStaticParamsFoo() {
  return [
    // ... ids, metadata, etc.
  ];
}

// getMetadataFoo.ts
export async function getMetadataFoo({ params }) {
  const data = await fetchFooData(params.id);
  return {
    title: data.summary.title,
    // ...
  };
}

// app/foo/[id]/page.tsx
export const generateStaticParams = isWeb ? getStaticParamsFoo : undefined;
export const generateMetadata = isWeb ? getMetadataFoo : undefined;
export default ({ params }: { params: Params<'id'> }) => {
  return <FooScreen id={params.id} />;
};
```

## Results

In theory this method works fine. It can be proven working using `pages Dir` in next 13. It's just `app Dir` that fucks with me, but that shouldn't take long to resolve so for now lets yolo it and use `app Dir` to build a client-side SPA 🤷‍♀️

This is fucking with me https://beta.nextjs.org/docs/configuring/static-export#dynamic-fetching-with-client-components

```sh
$ BUILD_CONTEXT=web yarn build

# Route (app)                                Size     First Load JS
# ┌ ○ /                                      7.42 kB         104 kB
# ├ λ /profile/[id]                          137 B          74.3 kB
# └ ● /recipe/[id]                           2.04 kB        98.4 kB
#     ├ /recipe/R001
#     ├ /recipe/R002
#     ├ /recipe/R003
#     └ [+6 more paths]

# λ  (Server)  server-side renders at runtime (uses getInitialProps or getServerSideProps)
# ○  (Static)  automatically rendered as static HTML (uses no initial props)
# ●  (SSG)     automatically generated as static HTML + JSON (uses getStaticProps)
```

```sh
$ BUILD_CONTEXT=native yarn build

# Route (app)                                Size     First Load JS
# ┌ ○ /                                      7.42 kB         104 kB
# ├ λ /profile/[id]                          137 B          74.3 kB
# └ λ /recipe/[id]                           2.04 kB        98.4 kB

# λ  (Server)  server-side renders at runtime (uses getInitialProps or getServerSideProps)
# ○  (Static)  automatically rendered as static HTML (uses no initial props)
```

### Export worker Next.js bug

This now has an [issue on the Next.js GitHub](https://github.com/vercel/next.js/issues/49059). Now we are so fucked that on next `13.4.1` or `13.4.4` we get an error trying to build the static export AND it doesn't actually give the static export:

```sh
> Build error occurred
Error: invariant: Undefined export worker for app dir, this is a bug in Next.js.
    at /Users/jay/dev/20230508t2038-my-next-app/node_modules/next/dist/export/index.js:506:27
    at Span.traceAsyncFn (/Users/jay/dev/20230508t2038-my-next-app/node_modules/next/dist/trace/trace.js:103:26)
    at /Users/jay/dev/20230508t2038-my-next-app/node_modules/next/dist/export/index.js:502:35
    at Array.map (<anonymous>)
    at /Users/jay/dev/20230508t2038-my-next-app/node_modules/next/dist/export/index.js:499:41
    at async Span.traceAsyncFn (/Users/jay/dev/20230508t2038-my-next-app/node_modules/next/dist/trace/trace.js:103
:20)
    at async /Users/jay/dev/20230508t2038-my-next-app/node_modules/next/dist/build/index.js:1887:17
    at async Span.traceAsyncFn (/Users/jay/dev/20230508t2038-my-next-app/node_modules/next/dist/trace/trace.js:103
:20)
    at async build (/Users/jay/dev/20230508t2038-my-next-app/node_modules/next/dist/build/index.js:143:29)
```

# Full-beans Next 13 w/ React Server Components

## Requirements

1. We only have to implement 1x primitive component for a given screen to support web & native,
2. we have one singular (or one unique set) of method for fetching the data required in a given screen,
3. we can choose to run or export the next app in a mostly SSR or SSG configuration - i.e. only some client-side queries for very intentional features/ux, and
4. we can choose to run or export the next app in a pure Client-Side configuration - i.e. dynamic routes will be stubbed exports and data will be fetched client-side to populate the pages.

## Thesis

I propose that we can achieve these requirements by:

1. Given each screen, create a `Screen` component with an API that supports basic props `{ id, data }`
2. Abstract every query into a Context-Agnostic `Fetch`-like Function (CAFF), which can be called as a query function or directly in a server function
3. Conditionally configure a global variable that tells us a) whether we should export server functions (staticprops/staticparams), and b) to render or not to render our custom `ClientSideProvider` wrappers
4. For each CAFF, implement a corresponding `ClientSideProvider` that will create the `query` and expose it to the corresponding `Screen` component

### The Composition Problem

This conditional provider wrapper may work well for cases where the `app/route/page.tsx` level handles the data fetching, but becomes trickier when we get to [RSC composition](https://www.plasmic.app/blog/how-react-server-components-work#the-server-client-component-divide). Within our happy, RSC path, every time a server component enters the mix will require another instance of our conditional provider pattern - assuming the purpose of the server component is to do data fetching (why else would it be there)

In that sense, this conditional provider wrapper needs to be super reusable and _work_.

### The 'use client' Conundrum

We also need to validate that `'use client'` can be conditionally placed in the `app/route/page.tsx` so that we can - once it is finally working again - make the dynamic pages [export to static](https://beta.nextjs.org/docs/configuring/static-export#dynamic-route-segments) so that they are usable from the native app.

### The Mutation Madness

I would prefer that we also have some more info on how mutations will eventually work in RSC. Will we be able to manage this with conditional providers? Is it too big of a gamble right now... yeah probably :/

## Theory

```tsx
// config.ts
export const isWeb = process.env.BUILD_CONTEXT === 'web';

// ClientSideProvider.tsx
('use client');
export function ClientSideProvider({ queryKey, queryFn, render }) {
  const { data, isLoading, error } = useClient(queryKey, queryFn);
  return render({ data, isLoading, error });
}

// fetchFooData.ts
async function fetchFooData(id) {
  return {
    // ...
  };
}

// FooLoading.tsx
export function FooLoading() {
  return <>Loading... ⏳</>;
}

// FooError.tsx
export function FooError() {
  return <>Error! 🤦‍♀️</>;
}

// FooScreen.tsx
export function FooScreen({ id, data }) {
  return (
    <div>
      <h1>{data.title}</h1>
      <form>
        <button>Thanks!</button>
      </form>
    </div>
  );
}

// app/foo/[id]/page.tsx
export default async function ({ id }) {
  if (isWeb) {
    const data = await fetchFooData(id);
    return <FooScreen id={id} data={serverData} />;
  }

  return (
    <ClientSideProvider
      queryKey={['foo', id]}
      queryFn={fetchFooData}
      render={({ data, isLoading, error }) => {
        if (isLoading) return <FooLoading />;
        if (error) return <FooError />;
        return <FooScreen id={id} data={data} />;
      }}
    />
  );
}
```
