import { GetStaticProps, NextPage } from 'next'
import { AboutPage } from '@app/pages/about'

interface Props {
  content: string
}

const Page: NextPage<Props> = ({ content }) => {
  console.info('AboutPage: render')
  return <AboutPage content={content} />
}

export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: {
    content: 'Some static website description',
  },
})

export default Page
