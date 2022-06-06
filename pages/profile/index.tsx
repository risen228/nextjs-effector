import { NextPage } from 'next'
import { MyProfilePage, pageStarted } from '@app/pages/my-profile'
import { createGSSP } from '@app/processes/app'

export const getServerSideProps = createGSSP([pageStarted])

const Page: NextPage = () => {
  return <MyProfilePage />
}

export default Page
