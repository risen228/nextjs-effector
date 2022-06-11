import { NextPage } from 'next'
import { AboutPage, pageStarted } from '@app/pages/about'
import { createGetStaticProps } from '@app/pages/shared/bindings'
import { appStarted } from '@app/pages/shared/model'
import { enhancePageEvent, useClientPageEvent } from '@app/shared/lib/effector'

interface Props {
  content: string
}

const enhanced = enhancePageEvent(appStarted, { runOnce: true })

const Page: NextPage<Props> = () => {
  console.info('AboutPage: render')

  useClientPageEvent(enhanced)
  return <AboutPage />
}

export const getStaticProps = createGetStaticProps({
  pageEvent: pageStarted,
})

export default Page
