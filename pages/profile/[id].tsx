import { GetServerSideProps, NextPage } from 'next'
import NextErrorPage from 'next/error'
import { useRouter } from 'next/router'
import { MyProfilePage, pageStarted } from '@app/pages/my-profile'
import { $bio } from '@app/pages/my-profile/model'
import { createGetInitialProps } from '@app/pages/shared'

interface Props {
  notFound?: boolean
}

const Page: NextPage<Props> = ({ notFound }) => {
  if (notFound) {
    return <NextErrorPage statusCode={404} />
  }

  return <MyProfilePage />
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  console.info(`GSSP`, context)
  return { props: {} }
}

export default Page
