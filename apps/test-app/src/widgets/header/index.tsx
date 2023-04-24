import clsx from 'clsx'
import { useUnit } from 'effector-react'
import Link from 'next/link'
import { $authenticatedUser } from '@app/entities/authenticated-user'
import { paths } from '@app/shared/routing'
import styles from './styles.module.css'

interface Route {
  title: string
  path: string
}

const routes: Route[] = [
  {
    title: 'Home',
    path: paths.home(),
  },
  {
    title: 'My Profile',
    path: paths.me(),
  },
  {
    title: 'Blog',
    path: paths.blog(),
  },
]

export function Header() {
  const user = useUnit($authenticatedUser)

  return (
    <header className={styles.header}>
      <Link legacyBehavior href={paths.home()} passHref>
        <a className={clsx([styles.navlink, styles.logo])} href="_">
          Effector + Next.js
        </a>
      </Link>
      <nav className={styles.navbar}>
        {routes.map((route) => (
          <Link key={route.path} legacyBehavior href={route.path} passHref>
            <a className={styles.navlink} href="_">
              {route.title}
            </a>
          </Link>
        ))}
      </nav>
      {user && (
        <Link legacyBehavior href={paths.me()} passHref>
          <a className={styles.navlink} href="_">
            Welcome, {user.firstName}!
          </a>
        </Link>
      )}
    </header>
  )
}
