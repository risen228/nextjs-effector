import { GetStaticPaths, NextPage } from 'next'
import { usePageEvent } from 'nextjs-effector'
import { createGSP } from '@app/layouts/factories'
import { BlogPostPage, pageStarted } from '@app/pages/blog-post'
import { localApi } from '@app/shared/api'
import { appStarted } from '@app/shared/events'

const Page: NextPage = () => {
  console.info('[Render] BlogPostPage')

  // eslint-disable-next-line effector/mandatory-scope-binding
  usePageEvent(appStarted, { runOnce: true })

  return <BlogPostPage />
}

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
  const posts = await localApi.getAllPostsFx()

  return {
    paths: posts.map((post) => ({
      params: { slug: post.slug },
    })),
    fallback: false,
  }
}

export const getStaticProps = createGSP<
  Record<string, never>,
  { slug: string }
>({
  pageEvent: pageStarted,
  customize: () => ({ revalidate: 60 }),
})

export default Page
