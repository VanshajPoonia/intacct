function getEnv(name: string) {
  return process.env[name]?.trim()
}

function getFirstDefinedEnv(names: string[]) {
  for (const name of names) {
    const value = getEnv(name)
    if (value) {
      return value
    }
  }

  return undefined
}

function getRequiredEnv(primaryName: string, fallbackNames: string[] = []) {
  const value = getFirstDefinedEnv([primaryName, ...fallbackNames])
  if (!value) {
    const fallbackMessage = fallbackNames.length ? ` (legacy fallbacks: ${fallbackNames.join(", ")})` : ""
    throw new Error(`Missing required Supabase environment variable: ${primaryName}${fallbackMessage}`)
  }

  return value
}

export function getSupabaseUrl() {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")
}

export function getSupabasePublishableKey() {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ["NEXT_PUBLIC_SUPABASE_ANON_KEY"])
}

export function getSupabaseSecretKey() {
  return getRequiredEnv("SUPABASE_SECRET_KEY", ["SUPABASE_SERVICE_ROLE_KEY"])
}

export function isSupabaseConfigured() {
  return Boolean(
    getEnv("NEXT_PUBLIC_SUPABASE_URL") &&
      getFirstDefinedEnv(["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]) &&
      getFirstDefinedEnv(["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"])
  )
}
