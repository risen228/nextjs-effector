import { NextPage } from 'next'
import { usePageEvent } from 'nextjs-effector'
import { createGSP } from '@app/layouts/factories'
import { BlogPage, pageStarted } from '@app/pages/blog'
import { appStarted } from '@app/shared/events'

const Page: NextPage = () => {
  console.info('[Render] BlogPage')

  // eslint-disable-next-line effector/mandatory-scope-binding
  usePageEvent(appStarted, { runOnce: true })

  return <BlogPage />
}

export const getStaticProps = createGSP({
  pageEvent: pageStarted,
})

export default Page
