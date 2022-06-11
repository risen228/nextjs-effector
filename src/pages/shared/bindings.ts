import {
  createAppGetInitialProps,
  createAppGetStaticProps,
} from '@app/shared/lib/effector'
import { appStarted } from './model'

export const createGetInitialProps = createAppGetInitialProps({
  sharedEvents: [appStarted],
})

export const createGetStaticProps = createAppGetStaticProps()
