import {
  createAppGetInitialProps,
  createAppGetServerSideProps,
} from '@app/shared/lib/effector'
import { appStarted } from './model'

export const createGetInitialProps = createAppGetInitialProps({
  appEvent: appStarted,
})

export const createGetServerSideProps = createAppGetServerSideProps({
  appEvent: appStarted,
})
