import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { getSupabaseSecretKey, getSupabaseUrl } from "./env"

export function createSupabaseAdminClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
