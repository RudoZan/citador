import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { citadorTables } from '../lib/tables'
import { CitationPanel } from './CitationPanel'
import { SectionsSidebar } from './SectionsSidebar'
import { TiptapEditor } from './TiptapEditor'
import { UserMenu } from './UserMenu'

export function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const [projectName, setProjectName] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId || !user) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from(citadorTables.projects)
        .select('name,user_id')
        .eq('id', projectId)
        .maybeSingle()
      if (cancelled) return
      setLoading(false)
      if (error || !data) {
        setForbidden(true)
        return
      }
      if (data.user_id !== user.id) {
        setForbidden(true)
        return
      }
      setProjectName(data.name as string)
      setForbidden(false)
    })()
    return () => {
      cancelled = true
    }
  }, [projectId, user])

  if (!projectId) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="screen-center muted">
        <p>Cargando proyecto…</p>
      </div>
    )
  }

  if (forbidden) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="layout-project">
      <header className="top-bar">
        <div className="top-bar-left">
          <Link className="breadcrumb" to="/">
            ← Proyectos
          </Link>
          <span className="project-title">{projectName}</span>
        </div>
        <div className="top-bar-actions">
          <button type="button" className="btn ghost tiny" disabled title="Próximamente">
            Exportar Word
          </button>
          <UserMenu />
        </div>
      </header>
      <div className="layout-three">
        <SectionsSidebar projectName={projectName} />
        <main className="main-editor">
          <TiptapEditor />
        </main>
        <CitationPanel />
      </div>
    </div>
  )
}
