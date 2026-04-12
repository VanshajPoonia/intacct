#!/usr/bin/env node

import process from "node:process"
import { createClient } from "@supabase/supabase-js"

function getEnv(name, fallbacks = []) {
  for (const candidate of [name, ...fallbacks]) {
    const value = process.env[candidate]?.trim()
    if (value) {
      return value
    }
  }
  return undefined
}

function requireEnv(name, fallbacks = []) {
  const value = getEnv(name, fallbacks)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SECRET_KEY", ["SUPABASE_SERVICE_ROLE_KEY"]),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

async function listAllUsers() {
  const users = []
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) {
      throw error
    }

    users.push(...data.users)
    if (data.users.length < 200) {
      break
    }

    page += 1
  }

  return users
}

async function ensureAuthUser(existingUsersByEmail, { email, password, userMetadata }) {
  const existing = existingUsersByEmail.get(email.toLowerCase())
  if (existing) {
    return existing.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  })

  if (error) {
    throw error
  }

  return data.user.id
}

async function main() {
  const identityModule = await import(new URL("../lib/mock-data/identity.ts", import.meta.url))
  const existingUsers = await listAllUsers()
  const existingUsersByEmail = new Map(
    existingUsers
      .filter(user => user.email)
      .map(user => [user.email.toLowerCase(), user])
  )

  await supabase.from("profiles").upsert(
    {
      id: "u-admin",
      organization_id: "org-admin",
      email: "admin@platform.financeos.local",
      auth_email: "admin@platform.financeos.local",
      username: "admin",
      first_name: "Platform",
      last_name: "Admin",
      display_name: "Platform Admin",
      title: "Global Administrator",
      role_id: "admin",
      status: "active",
      is_global_admin: true,
      default_entity_id: "e4",
    },
    { onConflict: "id" }
  )

  await supabase.from("organization_memberships").upsert(
    {
      profile_id: "u-admin",
      organization_id: "org-admin",
      role_id: "admin",
    },
    { onConflict: "profile_id,organization_id" }
  )

  const adminAuthUserId = await ensureAuthUser(existingUsersByEmail, {
    email: "admin@platform.financeos.local",
    password: "kvadmin123",
    userMetadata: {
      organization: "admin",
      username: "admin",
      isGlobalAdmin: true,
    },
  })

  await supabase
    .from("profiles")
    .update({
      auth_user_id: adminAuthUserId,
      last_login_at: new Date().toISOString(),
    })
    .eq("id", "u-admin")

  const seededUsers = identityModule.users ?? []

  for (const user of seededUsers) {
    const authUserId = await ensureAuthUser(existingUsersByEmail, {
      email: user.email,
      password: "demo123",
      userMetadata: {
        organization: "northstar",
        username: user.email.split("@")[0],
        role: user.role,
      },
    })

    await supabase
      .from("profiles")
      .update({
        auth_user_id: authUserId,
      })
      .eq("id", user.id)
  }

  console.log("Supabase auth users bootstrapped for platform admin and seeded workspace users.")
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
