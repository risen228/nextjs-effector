import { NextPage } from 'next'
import { HomePage, pageStarted } from '@app/pages/home'
import { createGSSP } from '@app/processes/app'

export const getServerSideProps = createGSSP([pageStarted])

const Home: NextPage = () => {
  return <HomePage />
}

export default Home
