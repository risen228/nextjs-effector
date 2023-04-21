import { useStore } from 'effector-react'
import { BaseTemplate } from '@app/computed/widgets/layouts'
import { $categories, $post } from './model'

export function BlogPostPage() {
  const post = useStore($post)
  const categories = useStore($categories)

  if (!post) {
    return null
  }

  return (
    <BaseTemplate
      title={post.title}
      content={
        <>
          <div className="flex gap-2">
            <span>Categories:</span>
            <ul className="flex gap-2">
              {categories.map((category, index) => {
                return (
                  <li key={category.id}>
                    {category.name}
                    {index + 1 !== categories.length && ','}
                  </li>
                )
              })}
            </ul>
          </div>
          <article className="mt-6">{post.content}</article>
        </>
      }
    />
  )
}
