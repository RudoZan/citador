import { useAuth } from '../hooks/useAuth'

export function UserMenu() {
  const { user, signOut } = useAuth()

  if (!user) return null

  const email = user.email ?? user.id.slice(0, 8)

  return (
    <div className="user-menu">
      <span className="user-email" title={email}>
        {email}
      </span>
      <button type="button" className="btn ghost tiny" onClick={() => void signOut()}>
        Salir
      </button>
    </div>
  )
}
