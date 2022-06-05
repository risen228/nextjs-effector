import { NextPage } from 'next'
import { appStarted } from '@app/entities/app'
import { MyProfilePage, pageStarted } from '@app/pages/my-profile'
import { createGSSP } from '@app/shared/lib/effector'

export const getServerSideProps = createGSSP([appStarted, pageStarted])

const Page: NextPage = () => {
  return <MyProfilePage />
}

export default Page
