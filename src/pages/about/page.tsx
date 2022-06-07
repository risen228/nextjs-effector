import { BaseTemplate } from '@app/computed/widgets/templates'

export interface Props {
  content: string
}

export function AboutPage({ content }: Props) {
  return <BaseTemplate title="About" content={<p>{content}</p>} />
}
