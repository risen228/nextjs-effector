import { GetStaticProps, NextPage } from 'next'
import { AboutPage } from '@app/pages/about'
import { appStarted } from '@app/pages/shared/model'
import { enhancePageEvent, useClientPageEvent } from '@app/shared/lib/effector'

interface Props {
  content: string
}

const enhanced = enhancePageEvent(appStarted, { runOnce: true })

const Page: NextPage<Props> = ({ content }) => {
  console.info('AboutPage: render')

  useClientPageEvent(enhanced)
  return <AboutPage content={content} />
}

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: {
    content: 'Some static website description',
  },
})

export default Page
