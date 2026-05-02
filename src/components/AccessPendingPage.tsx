import { useState } from 'react'
import type { AccessDisplayStatus } from '../hooks/useAccessRequest'
import { UserMenu } from './UserMenu'

type Props = {
  displayStatus: AccessDisplayStatus
  loadError: string | null
  submitRequest: (message?: string) => Promise<{ ok: boolean; error?: string }>
}

export function AccessPendingPage({ displayStatus, loadError, submitRequest }: Props) {
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onSubmit = async () => {
    setBusy(true)
    setErr(null)
    const r = await submitRequest(msg)
    setBusy(false)
    if (!r.ok && 'error' in r && r.error) setErr(r.error)
  }

  if (displayStatus === 'error') {
    return (
      <div className="stack narrow">
        <header className="top-bar simple">
          <span className="brand">Citador</span>
          <UserMenu />
        </header>
        <div className="panel tight">
          <h2>Error al cargar acceso</h2>
          <p className="muted tight">
            {loadError ??
              'No se pudo leer citador_access_requests. ¿Existen las tablas y políticas en Supabase?'}
          </p>
          <p className="tiny muted">
            Revisa CONTEXT.md y las migraciones; también variables en .env.local.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="stack narrow">
      <header className="top-bar simple">
        <span className="brand">Citador</span>
        <UserMenu />
      </header>
      <div className="panel tight">
        {displayStatus === 'pending' && (
          <>
            <h2>Solicitud pendiente</h2>
            <p className="muted tight">
              Tu acceso está en revisión. Cuando el administrador apruebe (por correo o manualmente
              en Supabase), actualiza esta página.
            </p>
          </>
        )}
        {displayStatus === 'rejected' && (
          <>
            <h2>Solicitud rechazada</h2>
            <p className="muted tight">Puedes enviar una nueva solicitud.</p>
          </>
        )}
        {(displayStatus === 'none' || displayStatus === 'rejected') && (
          <>
            <h2>Solicitar acceso</h2>
            <p className="muted tight">
              Completa una breve solicitud. El administrador recibirá un correo cuando esté
              configurado el backend (Edge Function).
            </p>
            <label className="field">
              <span className="label">Mensaje opcional</span>
              <textarea
                rows={3}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Ej.: estudiante USACH, proyecto de título…"
              />
            </label>
            {err && <p className="error-text">{err}</p>}
            <button type="button" className="btn primary" disabled={busy} onClick={() => void onSubmit()}>
              {busy ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
