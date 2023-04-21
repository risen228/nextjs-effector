import { NextPage } from 'next'
import NextErrorPage from 'next/error'
import { MyProfilePage, pageStarted } from '@app/pages/my-profile'
import { $bio } from '@app/pages/my-profile/model'
import { createGIP } from '@app/pages/shared'

interface Props {
  notFound?: boolean
}

const Page: NextPage<Props> = ({ notFound }) => {
  console.info('[Render] ProfilePage')

  if (notFound) {
    return <NextErrorPage statusCode={404} />
  }

  return <MyProfilePage />
}

Page.getInitialProps = createGIP<Props>({
  pageEvent: pageStarted,
  customize({ scope, context }) {
    const { res } = context
    const notFound = scope.getState($bio) === null
    if (notFound && res) res.statusCode = 404
    return { notFound }
  },
})

export default Page
