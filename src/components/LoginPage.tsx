import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()

  if (loading) {
    return (
      <div className="screen-center muted">
        <p>Cargando…</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="login-panel">
      <h1 className="login-title">Citador</h1>
      <p className="muted tight">Escritura académica con fuentes de cita enlazadas.</p>
      <button type="button" className="btn primary" onClick={() => void signInWithGoogle()}>
        Continuar con Google
      </button>
      <p className="muted tiny tight">
        Tras iniciar sesión podrás solicitar acceso si es tu primera vez.
      </p>
    </div>
  )
}
