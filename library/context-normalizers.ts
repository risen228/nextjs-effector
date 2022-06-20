import {
  GetServerSidePropsContext,
  GetStaticPropsContext,
  NextPageContext,
} from 'next'
import { NextRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { PageContext, StaticPageContext } from './types'

function normalizeQuery(query: ParsedUrlQuery, route: string) {
  const onlyQuery: ParsedUrlQuery = {}
  const onlyParams: ParsedUrlQuery = {}

  for (const [name, value] of Object.entries(query)) {
    if (!value) continue

    // handle catch and optional catch
    if (Array.isArray(value) && route.includes(`[...${name}]`)) {
      onlyParams[name] = value
      continue
    }

    if (route.includes(`[${name}]`)) {
      onlyParams[name] = value
      continue
    }

    onlyQuery[name] = value
  }

  return {
    params: onlyParams,
    query: onlyQuery,
  }
}

function removeParamsFromQuery(query: ParsedUrlQuery, params: ParsedUrlQuery) {
  const filteredEntries = Object.entries(query).filter(([key]) => {
    const hasProperty = Object.prototype.hasOwnProperty.call(params, key)
    return !hasProperty
  })

  return Object.fromEntries(filteredEntries)
}

function buildPathname({ req, resolvedUrl }: GetServerSidePropsContext) {
  const domain = req.headers.host
  const protocol = req.headers.referer?.split('://')?.[0] ?? 'https'
  return `${protocol}://` + domain + resolvedUrl
}

export const ContextNormalizers = {
  router: (router: NextRouter): PageContext => ({
    pathname: router.pathname,
    asPath: router.asPath,
    defaultLocale: router.defaultLocale,
    locale: router.locale,
    locales: router.locales,
    route: router.route,
    ...normalizeQuery(router.query, router.route),
  }),
  getInitialProps: (context: NextPageContext): PageContext => ({
    pathname: context.pathname,
    asPath: context.asPath,
    defaultLocale: context.defaultLocale,
    locale: context.locale,
    locales: context.locales,
    route: context.pathname,
    ...normalizeQuery(context.query, context.pathname),
  }),
  getServerSideProps: (context: GetServerSidePropsContext): PageContext => ({
    defaultLocale: context.defaultLocale,
    locale: context.locale,
    locales: context.locales,
    params: context.params ?? {},
    query: removeParamsFromQuery(context.query, context.params ?? {}),
    pathname: buildPathname(context),
  }),
  getStaticProps: (context: GetStaticPropsContext): StaticPageContext => ({
    defaultLocale: context.defaultLocale,
    locale: context.locale,
    locales: context.locales,
    params: context.params,
    preview: context.preview,
    previewData: context.previewData,
  }),
}
