import { ParsedUrlQuery } from 'querystring'
import { PageContext, ServerPageContext } from './types'

export function isClientPageContext<
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  P extends ParsedUrlQuery = ParsedUrlQuery
>(value: PageContext<Q, P>): value is ServerPageContext<Q, P> {
  return value.env === 'client'
}

export function isServerPageContext<
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  P extends ParsedUrlQuery = ParsedUrlQuery
>(value: PageContext<Q, P>): value is ServerPageContext<Q, P> {
  return value.env === 'server'
}
