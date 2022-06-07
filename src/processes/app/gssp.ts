import { createAppGetServerSideProps } from '@app/shared/lib/effector'
import { appStarted } from './model'

export const createGetServerSideProps = createAppGetServerSideProps({
  globalEvents: [appStarted],
})
