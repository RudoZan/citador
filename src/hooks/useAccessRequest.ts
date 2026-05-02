import type { User } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { citadorTables } from '../lib/tables'

export type AccessDisplayStatus =
  | 'loading'
  | 'none'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'error'

function mapRowToStatus(data: { status: string } | null): AccessDisplayStatus {
  if (!data) return 'none'
  const s = data.status
  if (s === 'approved' || s === 'pending' || s === 'rejected') return s
  return 'none'
}

export function useAccessRequest(user: User | null) {
  const [displayStatus, setDisplayStatus] = useState<AccessDisplayStatus>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setDisplayStatus('loading')
      setLoadError(null)
      return
    }
    let cancelled = false
    setDisplayStatus('loading')
    setLoadError(null)

    supabase
      .from(citadorTables.accessRequests)
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setLoadError(error.message)
          setDisplayStatus('error')
          return
        }
        setDisplayStatus(mapRowToStatus(data))
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const submitRequest = useCallback(
    async (message?: string) => {
      if (!user?.email) return { ok: false as const, error: 'Sin correo en la sesión.' }
      const row = {
        user_id: user.id,
        email: user.email,
        status: 'pending' as const,
        message: message?.trim() || null,
        requested_at: new Date().toISOString(),
      }
      const { error } = await supabase.from(citadorTables.accessRequests).upsert(row, {
        onConflict: 'user_id',
      })
      if (error) return { ok: false as const, error: error.message }

      const { data, error: readErr } = await supabase
        .from(citadorTables.accessRequests)
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()
      if (readErr) return { ok: false as const, error: readErr.message }
      setDisplayStatus(mapRowToStatus(data))
      return { ok: true as const }
    },
    [user],
  )

  const approved = displayStatus === 'approved'

  return {
    displayStatus,
    approved,
    loadError,
    submitRequest,
  }
}
