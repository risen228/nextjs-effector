import { EffectorNext } from "@effector/next";
import type { NextComponentType } from "next";
import type { AppContext, AppProps } from "next/app";
import React from "react";
import { INITIAL_STATE_KEY } from "./constants";

export function withEffector(App: NextComponentType<AppContext, any, any>) {
  return function EnhancedApp(props: AppProps<any>): React.ReactNode {
    const { [INITIAL_STATE_KEY]: initialState, ...pageProps } = props.pageProps;

    return React.createElement(
      EffectorNext,
      // @ts-expect-error
      { values: initialState },
      React.createElement(
        App,
        Object.assign({}, props, { pageProps: pageProps })
      )
    );
  };
}
