import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createHmac, timingSafeEqual } from "node:crypto"
import type { AuthImpersonation, AuthUser, UserPreferences } from "@/lib/types"
import { getSupabaseSecretKey, getSupabaseUrl } from "./env"
import { createSupabaseServerClient } from "./server"

const IMPERSONATION_COOKIE = "financeos_impersonation"

type ProfileRow = {
  id: string
  organization_id: string | null
  email: string
  auth_email: string | null
  username: string | null
  first_name: string
  last_name: string
  display_name: string | null
  title: string | null
  status: "active" | "inactive" | "pending"
  role_id: string | null
  avatar_url: string | null
  default_entity_id: string | null
  is_global_admin: boolean
  auth_user_id: string | null
}

type OrganizationRow = {
  id: string
  slug: string
  name: string
}

type PreferenceRow = {
  theme: UserPreferences["theme"]
  default_entity_id: string | null
  default_date_range: UserPreferences["defaultDateRange"]
  sidebar_collapsed: boolean
  notifications: UserPreferences["notifications"]
}

type ImpersonationPayload = {
  actorProfileId: string
  actorDisplayName: string
  actorEmail: string
  targetProfileId: string
  startedAt: string
}

function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function getImpersonationSecret() {
  return getSupabaseSecretKey()
}

function signPayload(serialized: string) {
  return createHmac("sha256", getImpersonationSecret()).update(serialized).digest("hex")
}

function encodeImpersonationCookie(payload: ImpersonationPayload) {
  const serialized = JSON.stringify(payload)
  return `${Buffer.from(serialized, "utf8").toString("base64url")}.${signPayload(serialized)}`
}

function decodeImpersonationCookie(rawValue?: string | null): ImpersonationPayload | null {
  if (!rawValue) {
    return null
  }

  const [encodedPayload, signature] = rawValue.split(".")
  if (!encodedPayload || !signature) {
    return null
  }

  try {
    const serialized = Buffer.from(encodedPayload, "base64url").toString("utf8")
    const expectedSignature = signPayload(serialized)

    if (
      signature.length !== expectedSignature.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null
    }

    const parsed = JSON.parse(serialized) as ImpersonationPayload
    if (!parsed.targetProfileId || !parsed.actorProfileId || !parsed.startedAt) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

async function getProfileByAuthUserId(authUserId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

  return data
}

async function getProfileById(profileId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

  return data
}

async function getOrganizationById(organizationId: string | null) {
  if (!organizationId) {
    return null
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("id", organizationId)
    .maybeSingle<OrganizationRow>()

  if (error) {
    throw error
  }

  return data
}

async function getRoleIdsForProfile(profileId: string) {
  const supabase = createAdminClient()
  const [{ data: entityMemberships, error: entityMembershipsError }, { data: organizationMemberships, error: organizationMembershipsError }] =
    await Promise.all([
      supabase.from("entity_memberships").select("role_id").eq("profile_id", profileId),
      supabase.from("organization_memberships").select("role_id").eq("profile_id", profileId),
    ])

  if (entityMembershipsError) {
    throw entityMembershipsError
  }

  if (organizationMembershipsError) {
    throw organizationMembershipsError
  }

  const ids = new Set<string>()
  entityMemberships?.forEach(entry => ids.add(entry.role_id))
  organizationMemberships?.forEach(entry => ids.add(entry.role_id))
  return [...ids]
}

async function getEntityIdsForProfile(profileId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("entity_memberships")
    .select("entity_id")
    .eq("profile_id", profileId)

  if (error) {
    throw error
  }

  return (data ?? []).map(entry => entry.entity_id)
}

export async function getUserPreferences(profileId: string, fallbackEntityId?: string | null): Promise<UserPreferences> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("user_preferences")
    .select("theme, default_entity_id, default_date_range, sidebar_collapsed, notifications")
    .eq("profile_id", profileId)
    .maybeSingle<PreferenceRow>()

  if (error) {
    throw error
  }

  return {
    theme: data?.theme ?? "system",
    defaultEntity: data?.default_entity_id ?? fallbackEntityId ?? "e4",
    defaultDateRange: data?.default_date_range ?? "this_month",
    sidebarCollapsed: data?.sidebar_collapsed ?? false,
    notifications: data?.notifications ?? {
      email: true,
      push: true,
      approvals: true,
      tasks: true,
    },
  }
}

function toAuthUser(
  profile: ProfileRow,
  organization: OrganizationRow | null,
  roleIds: string[],
  entityIds: string[],
  impersonation?: AuthImpersonation
): AuthUser {
  const primaryRole = (profile.role_id ?? roleIds[0] ?? "viewer") as AuthUser["role"]

  return {
    id: profile.id,
    organizationId: organization?.id ?? profile.organization_id ?? "org-admin",
    organizationSlug: organization?.slug ?? "admin",
    username: profile.username ?? profile.email,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: primaryRole,
    roleIds: roleIds.length ? (roleIds as AuthUser["roleIds"]) : [primaryRole],
    avatar: profile.avatar_url ?? undefined,
    entityIds,
    primaryEntityId: profile.default_entity_id ?? entityIds[0],
    isGlobalAdmin: profile.is_global_admin,
    impersonation,
  }
}

async function resolveActorUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!user) {
    return null
  }

  const profile = await getProfileByAuthUserId(user.id)
  if (!profile || profile.status !== "active") {
    return null
  }

  const [organization, roleIds, entityIds] = await Promise.all([
    getOrganizationById(profile.organization_id),
    getRoleIdsForProfile(profile.id),
    getEntityIdsForProfile(profile.id),
  ])

  return toAuthUser(profile, organization, roleIds, entityIds)
}

export async function getOptionalAuthenticatedAppUser(): Promise<AuthUser | null> {
  const actor = await resolveActorUser()
  if (!actor) {
    return null
  }

  const cookieStore = await cookies()
  const impersonationPayload = decodeImpersonationCookie(cookieStore.get(IMPERSONATION_COOKIE)?.value)

  if (!impersonationPayload || !actor.isGlobalAdmin) {
    return actor
  }

  const targetProfile = await getProfileById(impersonationPayload.targetProfileId)
  if (!targetProfile || targetProfile.status !== "active") {
    return actor
  }

  const [organization, roleIds, entityIds] = await Promise.all([
    getOrganizationById(targetProfile.organization_id),
    getRoleIdsForProfile(targetProfile.id),
    getEntityIdsForProfile(targetProfile.id),
  ])

  return toAuthUser(targetProfile, organization, roleIds, entityIds, {
    actorProfileId: actor.id,
    actorDisplayName: `${actor.firstName} ${actor.lastName}`.trim(),
    actorEmail: actor.email,
    targetProfileId: targetProfile.id,
    startedAt: new Date(impersonationPayload.startedAt),
  })
}

export async function requireAuthenticatedAppUser(): Promise<AuthUser> {
  const user = await getOptionalAuthenticatedAppUser()
  if (!user) {
    throw new Error("Authentication required.")
  }
  return user
}

export async function createImpersonationCookieValue(targetProfileId: string) {
  const actor = await resolveActorUser()
  if (!actor || !actor.isGlobalAdmin) {
    throw new Error("Global admin access is required to impersonate another user.")
  }

  return encodeImpersonationCookie({
    actorProfileId: actor.id,
    actorDisplayName: `${actor.firstName} ${actor.lastName}`.trim(),
    actorEmail: actor.email,
    targetProfileId,
    startedAt: new Date().toISOString(),
  })
}

export function getImpersonationCookieName() {
  return IMPERSONATION_COOKIE
}
