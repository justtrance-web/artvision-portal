import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

// Re-export для совместимости
export const createClient = () => createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Client = {
  id: string
  name: string
  domain: string
  status: "active" | "presale" | "paused" | "archived"
  type: string
  metrika_id?: string
}

export type Recommendation = {
  id: string
  client_id: string
  cluster_name: string
  description: string
  potential_impressions: number
  status: string
}
