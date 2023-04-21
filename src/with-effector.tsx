import { EffectorNext } from '@effector/next'
import { NextComponentType } from 'next'
import { AppContext, AppProps } from 'next/app'
import React from 'react'
import { INITIAL_STATE_KEY } from './constants'

export function withEffector(App: NextComponentType<AppContext, any, any>) {
  return function EnhancedApp(props: AppProps<any>) {
    const { [INITIAL_STATE_KEY]: initialState, ...pageProps } = props.pageProps

    return (
      <EffectorNext values={initialState}>
        <App {...props} pageProps={pageProps} />
      </EffectorNext>
    )
  }
}
