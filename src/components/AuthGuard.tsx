import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAccessRequest } from '../hooks/useAccessRequest'
import { AccessPendingPage } from './AccessPendingPage'

export function AuthGuard() {
  const { user, loading: authLoading } = useAuth()
  const access = useAccessRequest(user)

  if (authLoading || (user && access.displayStatus === 'loading')) {
    return (
      <div className="screen-center muted">
        <p>Cargando…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!access.approved) {
    return (
      <AccessPendingPage
        displayStatus={access.displayStatus}
        loadError={access.loadError}
        submitRequest={access.submitRequest}
      />
    )
  }

  return <Outlet />
}
