import { NextPage } from 'next'
import { createGIP } from '@app/layouts/factories'
import { HomePage, pageStarted } from '@app/pages/home'

const Page: NextPage = () => {
  console.info('[Render] HomePage')
  return <HomePage />
}

Page.getInitialProps = createGIP({
  pageEvent: pageStarted,
})

export default Page
