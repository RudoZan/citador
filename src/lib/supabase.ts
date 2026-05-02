import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    '[Citador] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example → .env.local',
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '')
