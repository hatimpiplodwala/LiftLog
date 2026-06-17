import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase env vars. Copy .env.local.example to .env.local and fill in your project credentials.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Awaits a Supabase query/RPC, throwing on error and returning just the data —
// collapses the repeated `const { data, error } = await …; if (error) throw error`.
// `data` is unknown because PostgREST infers embedded relations as arrays; the
// caller asserts the real shape via the type argument, as the call sites did before.
export async function unwrap<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>,
): Promise<T> {
  const { data, error } = await query
  if (error) throw error
  return data as T
}
