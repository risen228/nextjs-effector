import { NextPage } from 'next'
import { HomePage, pageStarted } from '@app/pages/home'
import { createGetInitialProps } from '@app/processes/app'

const Page: NextPage = () => {
  return <HomePage />
}

Page.getInitialProps = createGetInitialProps([pageStarted])

export default Page
