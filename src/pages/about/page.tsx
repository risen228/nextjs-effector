import { useStore } from 'effector-react'
import { BaseTemplate } from '@app/computed/widgets/layouts'
import { $authenticatedUser } from '@app/entities/authenticated-user'

export interface Props {
  content: string
}

export function AboutPage({ content }: Props) {
  const user = useStore($authenticatedUser)
  return (
    <BaseTemplate
      title="About"
      content={
        <div>
          User is loaded: {user?.firstName}
          <br />
          <p className="mt-4">{content}</p>
        </div>
      }
    />
  )
}
