import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && key)

// The anon key is safe to ship in the browser: row-level security (supabase/schema.sql) is what protects data.
export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing')
