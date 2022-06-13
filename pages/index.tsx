import { NextPage } from 'next'
import { HomePage, pageStarted } from '@app/pages/home'
import { createGIP } from '@app/pages/shared'

const Page: NextPage = () => {
  return <HomePage />
}

Page.getInitialProps = createGIP({
  pageEvent: pageStarted,
})

export default Page
