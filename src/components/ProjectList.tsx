import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { UserMenu } from './UserMenu'

export function ProjectList() {
  const { user } = useAuth()
  const { projects, loading, error, createProject } = useProjects(user, !!user)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  const onCreate = async () => {
    setCreating(true)
    setFormErr(null)
    const r = await createProject(name)
    setCreating(false)
    if (!r.ok) {
      setFormErr(r.error)
      return
    }
    setName('')
  }

  return (
    <div className="stack fill-height">
      <header className="top-bar simple">
        <span className="brand">Citador</span>
        <UserMenu />
      </header>
      <main className="panel-page">
        <div className="row spread tight">
          <h2 className="tight">Proyectos</h2>
        </div>
        {error && <p className="error-text tight">{error}</p>}
        <div className="row tight">
          <input
            className="input grow"
            placeholder="Nombre del proyecto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void onCreate()}
          />
          <button type="button" className="btn primary" disabled={creating} onClick={() => void onCreate()}>
            {creating ? 'Creando…' : 'Nuevo'}
          </button>
        </div>
        {formErr && <p className="error-text">{formErr}</p>}
        {loading ? (
          <p className="muted tiny">Cargando proyectos…</p>
        ) : projects.length === 0 ? (
          <p className="muted tight">No hay proyectos. Crea uno para empezar.</p>
        ) : (
          <ul className="list-compact">
            {projects.map((p) => (
              <li key={p.id}>
                <Link className="link-project" to={`/p/${p.id}`}>
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
