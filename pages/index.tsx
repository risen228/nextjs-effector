import { NextPage } from 'next'
import { appStarted } from '@app/entities/app'
import { HomePage, pageStarted } from '@app/pages/home'
import { createGSSP } from '@app/shared/lib/effector'

export const getServerSideProps = createGSSP([appStarted, pageStarted])

const Home: NextPage = () => {
  return <HomePage />
}

export default Home
