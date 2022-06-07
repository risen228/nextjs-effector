import { NextPage } from 'next'
import NextErrorPage from 'next/error'
import { MyProfilePage, pageStarted } from '@app/pages/my-profile'
import { $bio } from '@app/pages/my-profile/model'
import { createGetInitialProps } from '@app/processes/app'

interface Props {
  notFound?: boolean
}

const Page: NextPage<Props> = ({ notFound }) => {
  if (notFound) {
    return <NextErrorPage statusCode={404} />
  }

  return <MyProfilePage />
}

Page.getInitialProps = createGetInitialProps<Props>(
  [pageStarted],
  (scope) =>
    async ({ res }) => {
      const notFound = scope.getState($bio) === null
      if (notFound && res) res.statusCode = 404
      return { notFound }
    }
)

export default Page
