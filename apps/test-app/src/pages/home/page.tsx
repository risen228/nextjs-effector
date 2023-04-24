import { useUnit } from 'effector-react'
import { BaseTemplate } from '@app/computed/widgets/layouts'
import { $authenticatedUser } from '@app/entities/authenticated-user'

export function HomePage() {
  const user = useUnit($authenticatedUser)

  return (
    <BaseTemplate
      title="Home"
      content={<pre>User: {JSON.stringify(user, null, 2)}</pre>}
    />
  )
}
