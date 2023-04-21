import { NextPage } from 'next'
import { usePageEvent } from 'nextjs-effector'
import { BlogPage, pageStarted } from '@app/pages/blog'
import { createGSP } from '@app/pages/shared/bindings'
import { appStarted } from '@app/pages/shared/model'

const Page: NextPage = () => {
  console.info('[Render] BlogPage')

  usePageEvent(appStarted, { runOnce: true })
  return <BlogPage />
}

export const getStaticProps = createGSP({
  pageEvent: pageStarted,
})

export default Page
