import { NextPage } from 'next'
import { AboutPage, pageStarted } from '@app/pages/about'
import { createGetStaticProps } from '@app/pages/shared/bindings'
import { appStarted } from '@app/pages/shared/model'
import { usePageEvent } from '@app/shared/lib/effector'

interface Props {
  content: string
}

const Page: NextPage<Props> = () => {
  console.info('AboutPage: render')

  usePageEvent(appStarted, { runOnce: true })
  return <AboutPage />
}

export const getStaticProps = createGetStaticProps({
  pageEvent: pageStarted,
})

export default Page
