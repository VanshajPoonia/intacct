"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/types/supabase"
import { getSupabasePublishableKey, getSupabaseUrl } from "./env"

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabasePublishableKey())
}
