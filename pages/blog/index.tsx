import { NextPage } from 'next'
import { BlogPage, pageStarted } from '@app/pages/blog'
import { createGetStaticProps } from '@app/pages/shared/bindings'
import { appStarted } from '@app/pages/shared/model'
import { usePageEvent } from '@app/shared/lib/effector'

const Page: NextPage = () => {
  console.info('[Render] BlogPage')

  usePageEvent(appStarted, { runOnce: true })
  return <BlogPage />
}

export const getStaticProps = createGetStaticProps({
  pageEvent: pageStarted,
})

export default Page
