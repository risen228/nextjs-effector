import { NextPage } from 'next'
import { MyProfilePage, pageStarted } from '@app/pages/my-profile'
import { createGetInitialProps } from '@app/processes/app'

const Page: NextPage = () => {
  return <MyProfilePage />
}

Page.getInitialProps = createGetInitialProps([pageStarted])

export default Page
