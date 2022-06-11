import { NextPage } from 'next'
import { AboutPage, pageStarted } from '@app/pages/about'
import { createGetStaticProps } from '@app/pages/shared'

interface Props {
  content: string
}

const Page: NextPage<Props> = ({ content }) => {
  console.info('AboutPage SSG: render')

  return <AboutPage content={content} />
}

export const getStaticProps = createGetStaticProps({
  pageEvent: pageStarted,
  create: () => async () => {
    return {
      props: {
        content:
          'Some SSG website description with revalidate each 10 sec (in DEV mode - on each request), result is ' +
          Math.random(),
      },
      revalidate: 10, // In seconds
    }
  },
})

// export const getStaticProps: GetStaticProps<Props> = async () => ({
//   props: {
//     content: 'Some static website description',
//   },
// })

export default Page
