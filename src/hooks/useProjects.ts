import type { User } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { citadorTables } from '../lib/tables'

export type ProjectRow = {
  id: string
  name: string
  updated_at: string | null
}

export function useProjects(user: User | null, enabled: boolean) {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !enabled) {
      setProjects([])
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from(citadorTables.projects)
      .select('id,name,updated_at')
      .order('updated_at', { ascending: false })
      .then(({ data, error: qErr }) => {
        if (cancelled) return
        setLoading(false)
        if (qErr) {
          setError(qErr.message)
          setProjects([])
          return
        }
        setProjects((data ?? []) as ProjectRow[])
      })

    return () => {
      cancelled = true
    }
  }, [user, enabled])

  const createProject = useCallback(
    async (name: string) => {
      if (!user) return { ok: false as const, error: 'No hay usuario.' }
      const trimmed = name.trim()
      if (!trimmed) return { ok: false as const, error: 'Nombre vacío.' }
      const { data, error: insErr } = await supabase
        .from(citadorTables.projects)
        .insert({ name: trimmed, user_id: user.id })
        .select('id')
        .single()
      if (insErr) return { ok: false as const, error: insErr.message }

      const { data: list, error: qErr } = await supabase
        .from(citadorTables.projects)
        .select('id,name,updated_at')
        .order('updated_at', { ascending: false })
      if (qErr) return { ok: true as const, id: data.id as string }
      setProjects((list ?? []) as ProjectRow[])
      return { ok: true as const, id: data.id as string }
    },
    [user],
  )

  return { projects, loading, error, createProject }
}
