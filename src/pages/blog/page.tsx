import { useStore } from 'effector-react'
import Link from 'next/link'
import { BaseTemplate } from '@app/computed/widgets/layouts'
import { paths } from '@app/shared/routing'
import { $posts } from './model'

export function BlogPage() {
  const posts = useStore($posts)

  return (
    <BaseTemplate
      title="Blog"
      content={posts.map((post) => {
        return (
          <Link key={post.id} href={paths.blogPost(post.slug)} passHref={true}>
            <a href="_">
              <h3>{post.title}</h3>
            </a>
          </Link>
        )
      })}
    />
  )
}
