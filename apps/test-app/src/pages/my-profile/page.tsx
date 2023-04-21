import { useStore } from 'effector-react'
import { BaseTemplate } from '@app/computed/widgets/layouts'
import { $authenticatedUser } from '@app/entities/authenticated-user'
import { $bio } from './model'

export function MyProfilePage() {
  const user = useStore($authenticatedUser)
  const bio = useStore($bio)

  return (
    <BaseTemplate
      title="My profile"
      content={
        <>
          <pre>User: {JSON.stringify(user, null, 2)}</pre>
          <pre className="mt-8">Bio: {JSON.stringify(bio, null, 2)}</pre>
        </>
      }
    />
  )
}
