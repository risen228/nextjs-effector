import { useStore } from 'effector-react'
import { BaseTemplate } from '@app/computed/widgets/layouts'
import { $content } from './model'

export function AboutPage() {
  const content = useStore($content)

  return <BaseTemplate title="About" content={<p>{content}</p>} />
}
