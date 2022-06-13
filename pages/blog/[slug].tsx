import { GetStaticPaths, NextPage } from 'next'
import { BlogPostPage, pageStarted } from '@app/pages/blog-post'
import { createGetStaticProps } from '@app/pages/shared/bindings'
import { appStarted } from '@app/pages/shared/model'
import { localApi } from '@app/shared/api'
import { usePageEvent } from '@app/shared/lib/effector'

const Page: NextPage = () => {
  console.info('[Render] BlogPostPage')

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

export const getStaticProps = createGetStaticProps<{}, { slug: string }>({
  pageEvent: pageStarted,
})

export default Page
