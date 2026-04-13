import "server-only"

import { randomUUID } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import type { PaginatedResponse, Permission, RoleId, User, UserAccessDetail, UserAccessEntityOption, UserAccessFormInput, UserAccessOptions, UserAccessOrganization, UserAccessRecord } from "@/lib/types"
import type { AuthUser } from "@/lib/types/identity"
import { getSupabaseSecretKey, getSupabaseUrl } from "./env"

type ProfileRow = {
  id: string
  organization_id: string | null
  auth_user_id: string | null
  auth_email: string | null
  email: string
  username: string | null
  first_name: string
  last_name: string
  display_name: string | null
  title: string | null
  status: "active" | "inactive" | "pending"
  role_id: string | null
  avatar_url: string | null
  last_login_at: string | null
  created_at: string
  default_entity_id: string | null
  is_global_admin: boolean
}

type OrganizationRow = {
  id: string
  name: string
  slug: string
  status: "active" | "inactive"
}

type EntityRow = {
  id: string
  name: string
  code: string
  type: "primary" | "subsidiary" | "consolidated"
  status: "active" | "inactive"
  organization_id: string | null
  parent_entity_id: string | null
}

type RoleRow = {
  id: string
  name: string
  description: string
  accent_label: string
}

type PermissionRow = {
  id: string
  label: string
}

type RolePermissionRow = {
  role_id: string
  permission_id: string
}

type OrganizationMembershipRow = {
  profile_id: string
  organization_id: string
  role_id: string
}

type EntityMembershipRow = {
  id: string
  profile_id: string
  entity_id: string
  organization_id: string | null
  role_id: string
  created_at: string
}

type AuditLogRow = {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  target_profile_id: string | null
  actor_profile_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

type ActivityEventRow = {
  id: string
  type: string
  title: string
  description: string | null
  profile_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

type UserListFilters = {
  search?: string
  organizationId?: string
  roleId?: string
  status?: string
  entityId?: string
  sortKey?: string
  sortDirection?: "asc" | "desc"
  page?: number
  pageSize?: number
}

function createSupabaseAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as any
}

function createAuditId(prefix: string) {
  return `${prefix}-${randomUUID()}`
}

function isUserAdmin(actor: AuthUser) {
  return actor.isGlobalAdmin || actor.roleIds.includes("admin")
}

function requireUserManager(actor: AuthUser) {
  if (!isUserAdmin(actor)) {
    throw new Error("You do not have permission to manage users.")
  }
}

function normalizeRoleId(value?: string | null): RoleId {
  const candidate = value ?? "viewer"
  return candidate as RoleId
}

function toDisplayName(profile: ProfileRow) {
  return profile.display_name ?? `${profile.first_name} ${profile.last_name}`.trim()
}

function toOrganization(record?: OrganizationRow | null): UserAccessOrganization {
  return {
    id: record?.id ?? "org-admin",
    name: record?.name ?? "Platform Administration",
    slug: record?.slug ?? "admin",
  }
}

function toEntityOption(record: EntityRow, organizationName: string): UserAccessEntityOption {
  return {
    id: record.id,
    name: record.name,
    code: record.code,
    type: record.type,
    status: record.status,
    organizationId: record.organization_id ?? "",
    organizationName,
    parentEntityId: record.parent_entity_id ?? undefined,
  }
}

function toUser(record: UserAccessRecord): User {
  return {
    id: record.id,
    organizationId: record.organizationId,
    organizationSlug: record.organizationSlug,
    username: record.username,
    email: record.email,
    firstName: record.firstName,
    lastName: record.lastName,
    displayName: record.displayName,
    role: record.role,
    roleIds: record.roleIds,
    status: record.status,
    entityIds: record.entityIds,
    primaryEntityId: record.primaryEntityId,
    title: record.title,
    lastLoginAt: record.lastLoginAt,
    createdAt: record.createdAt,
    avatar: record.avatar,
    isGlobalAdmin: record.isGlobalAdmin,
  }
}

async function listAuthUsersByEmail(email: string) {
  const admin = createSupabaseAdminClient()
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) {
      throw error
    }

    const match = data.users.find((user: { email?: string | null }) => user.email?.toLowerCase() === email.toLowerCase())
    if (match) {
      return match
    }

    if (data.users.length < 200) {
      break
    }

    page += 1
  }

  return null
}

async function getManageableOrganizations(actor: AuthUser) {
  const admin = createSupabaseAdminClient()
  const query = admin.from("organizations").select("id, name, slug, status").eq("status", "active")
  if (!actor.isGlobalAdmin) {
    query.eq("id", actor.organizationId)
  }

  const { data, error } = await query
  if (error) {
    throw error
  }

  return ((data ?? []) as OrganizationRow[]).filter(organization => organization.slug !== "admin")
}

async function getRolesWithPermissions() {
  const admin = createSupabaseAdminClient()
  const [{ data: rolesData, error: rolesError }, { data: permissionsData, error: permissionsError }, { data: rolePermissionsData, error: rolePermissionsError }] =
    await Promise.all([
      admin.from("roles").select("id, name, description, accent_label").order("name", { ascending: true }),
      admin.from("permissions").select("id, label"),
      admin.from("role_permissions").select("role_id, permission_id"),
    ])

  if (rolesError) {
    throw rolesError
  }

  if (permissionsError) {
    throw permissionsError
  }

  if (rolePermissionsError) {
    throw rolePermissionsError
  }

  const permissionMap = new Map(((permissionsData ?? []) as PermissionRow[]).map(permission => [permission.id, permission]))

  return ((rolesData ?? []) as RoleRow[]).map(role => ({
    id: role.id as RoleId,
    name: role.name,
    description: role.description,
    accentLabel: role.accent_label,
    permissions: ((rolePermissionsData ?? []) as RolePermissionRow[])
      .filter(permission => permission.role_id === role.id)
      .map(permission => permissionMap.get(permission.permission_id))
      .filter((permission): permission is PermissionRow => Boolean(permission))
      .map(permission => ({
        id: permission.id as Permission,
        label: permission.label,
      })),
  }))
}

async function getEntityOptionsForOrganizations(organizationIds: string[]) {
  if (!organizationIds.length) {
    return []
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("entities")
    .select("id, name, code, type, status, organization_id, parent_entity_id")
    .in("organization_id", organizationIds)
    .order("name", { ascending: true })

  if (error) {
    throw error
  }

  const organizations = await getOrganizationsByIds(organizationIds)
  const organizationMap = new Map(organizations.map(organization => [organization.id, organization]))

  return ((data ?? []) as EntityRow[]).map(entity =>
    toEntityOption(entity, organizationMap.get(entity.organization_id ?? "")?.name ?? "Unknown Organization")
  )
}

async function getOrganizationsByIds(organizationIds: string[]) {
  if (!organizationIds.length) {
    return []
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("organizations")
    .select("id, name, slug, status")
    .in("id", organizationIds)

  if (error) {
    throw error
  }

  return (data ?? []) as OrganizationRow[]
}

async function getProfilesByIds(profileIds: string[]) {
  if (!profileIds.length) {
    return []
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .in("id", profileIds)

  if (error) {
    throw error
  }

  return (data ?? []) as ProfileRow[]
}

async function getOrganizationMemberships(profileIds: string[]) {
  if (!profileIds.length) {
    return []
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("organization_memberships")
    .select("profile_id, organization_id, role_id")
    .in("profile_id", profileIds)

  if (error) {
    throw error
  }

  return (data ?? []) as OrganizationMembershipRow[]
}

async function getEntityMemberships(profileIds: string[]) {
  if (!profileIds.length) {
    return []
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("entity_memberships")
    .select("id, profile_id, entity_id, organization_id, role_id, created_at")
    .in("profile_id", profileIds)

  if (error) {
    throw error
  }

  return (data ?? []) as EntityMembershipRow[]
}

async function getEntitiesByIds(entityIds: string[]) {
  if (!entityIds.length) {
    return []
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("entities")
    .select("id, name, code, type, status, organization_id, parent_entity_id")
    .in("id", entityIds)

  if (error) {
    throw error
  }

  return (data ?? []) as EntityRow[]
}

function buildUserAccessRecord(
  profile: ProfileRow,
  organizations: Map<string, OrganizationRow>,
  organizationMemberships: OrganizationMembershipRow[],
  entityMemberships: EntityMembershipRow[],
  entities: Map<string, EntityRow>
): UserAccessRecord {
  const organization = toOrganization(organizations.get(profile.organization_id ?? ""))
  const profileEntityMemberships = entityMemberships
    .filter(membership => membership.profile_id === profile.id)
    .sort((left, right) => left.created_at.localeCompare(right.created_at))

  const roleIds = new Set<RoleId>()
  if (profile.role_id) {
    roleIds.add(normalizeRoleId(profile.role_id))
  }

  organizationMemberships
    .filter(membership => membership.profile_id === profile.id)
    .forEach(membership => roleIds.add(normalizeRoleId(membership.role_id)))

  profileEntityMemberships.forEach(membership => roleIds.add(normalizeRoleId(membership.role_id)))

  const entityIds = profileEntityMemberships.map(membership => membership.entity_id)
  const primaryEntityId = profile.default_entity_id ?? entityIds[0]

  return {
    id: profile.id,
    organizationId: organization.id,
    organizationName: organization.name,
    organizationSlug: organization.slug,
    username: profile.username ?? profile.email,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    displayName: toDisplayName(profile),
    title: profile.title ?? undefined,
    role: normalizeRoleId(profile.role_id ?? [...roleIds][0]),
    roleIds: [...roleIds].length ? [...roleIds] : [normalizeRoleId(profile.role_id)],
    status: profile.status,
    entityIds,
    entityNames: entityIds.map(entityId => entities.get(entityId)?.name ?? entityId),
    primaryEntityId,
    primaryEntityName: primaryEntityId ? entities.get(primaryEntityId)?.name ?? primaryEntityId : undefined,
    lastLoginAt: profile.last_login_at ? new Date(profile.last_login_at) : undefined,
    createdAt: new Date(profile.created_at),
    avatar: profile.avatar_url ?? undefined,
    isGlobalAdmin: profile.is_global_admin,
  }
}

function filterUserAccessRecords(records: UserAccessRecord[], filters: UserListFilters) {
  const search = filters.search?.trim().toLowerCase()

  return records.filter(record => {
    if (filters.organizationId && record.organizationId !== filters.organizationId) {
      return false
    }

    if (filters.roleId && record.role !== filters.roleId) {
      return false
    }

    if (filters.status && record.status !== filters.status) {
      return false
    }

    if (filters.entityId && !record.entityIds.includes(filters.entityId)) {
      return false
    }

    if (!search) {
      return true
    }

    return [
      record.displayName,
      record.email,
      record.username,
      record.organizationName,
      record.primaryEntityName,
      record.title,
    ].some(value => value?.toLowerCase().includes(search))
  })
}

function sortUserAccessRecords(records: UserAccessRecord[], sortKey = "createdAt", direction: "asc" | "desc" = "desc") {
  const normalizedDirection = direction === "asc" ? 1 : -1
  return [...records].sort((left, right) => {
    const leftValue =
      sortKey === "lastLoginAt" ? left.lastLoginAt?.getTime() ?? 0 :
      sortKey === "displayName" ? left.displayName.toLowerCase() :
      sortKey === "role" ? left.role :
      sortKey === "status" ? left.status :
      sortKey === "organizationName" ? left.organizationName.toLowerCase() :
      sortKey === "primaryEntityName" ? (left.primaryEntityName ?? "").toLowerCase() :
      sortKey === "entityCount" ? left.entityIds.length :
      left.createdAt.getTime()

    const rightValue =
      sortKey === "lastLoginAt" ? right.lastLoginAt?.getTime() ?? 0 :
      sortKey === "displayName" ? right.displayName.toLowerCase() :
      sortKey === "role" ? right.role :
      sortKey === "status" ? right.status :
      sortKey === "organizationName" ? right.organizationName.toLowerCase() :
      sortKey === "primaryEntityName" ? (right.primaryEntityName ?? "").toLowerCase() :
      sortKey === "entityCount" ? right.entityIds.length :
      right.createdAt.getTime()

    if (leftValue < rightValue) {
      return -1 * normalizedDirection
    }

    if (leftValue > rightValue) {
      return 1 * normalizedDirection
    }

    return 0
  })
}

function paginateRecords<T>(records: T[], page = 1, pageSize = 25): PaginatedResponse<T> {
  const total = records.length
  const safePageSize = Math.max(pageSize, 1)
  const safePage = Math.max(page, 1)
  const totalPages = Math.max(Math.ceil(total / safePageSize), 1)
  const start = (safePage - 1) * safePageSize

  return {
    data: records.slice(start, start + safePageSize),
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  }
}

async function getAccessibleUserRecords(actor: AuthUser, filters: UserListFilters) {
  const organizations = await getManageableOrganizations(actor)
  const manageableOrganizationIds = organizations.map(organization => organization.id)

  if (!manageableOrganizationIds.length) {
    return paginateRecords([], filters.page, filters.pageSize)
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .in("organization_id", filters.organizationId ? [filters.organizationId] : manageableOrganizationIds)

  if (error) {
    throw error
  }

  const profiles = ((data ?? []) as ProfileRow[]).filter(profile => !profile.is_global_admin)
  const profileIds = profiles.map(profile => profile.id)
  const [organizationMemberships, entityMemberships] = await Promise.all([
    getOrganizationMemberships(profileIds),
    getEntityMemberships(profileIds),
  ])

  const entityIds = Array.from(new Set(entityMemberships.map(membership => membership.entity_id)))
  const entities = await getEntitiesByIds(entityIds)
  const organizationMap = new Map(organizations.map(organization => [organization.id, organization]))
  const entityMap = new Map(entities.map(entity => [entity.id, entity]))

  const records = profiles.map(profile =>
    buildUserAccessRecord(profile, organizationMap, organizationMemberships, entityMemberships, entityMap)
  )

  const filtered = filterUserAccessRecords(records, filters)
  const sorted = sortUserAccessRecords(filtered, filters.sortKey, filters.sortDirection)
  return paginateRecords(sorted, filters.page, filters.pageSize)
}

async function requireManagedProfile(actor: AuthUser, profileId: string) {
  requireUserManager(actor)

  const profiles = await getProfilesByIds([profileId])
  const profile = profiles[0]

  if (!profile || profile.is_global_admin) {
    throw new Error("User not found.")
  }

  if (!actor.isGlobalAdmin && profile.organization_id !== actor.organizationId) {
    throw new Error("You do not have access to this user.")
  }

  return profile
}

async function validateUserFormInput(actor: AuthUser, input: UserAccessFormInput, existingProfile?: ProfileRow) {
  requireUserManager(actor)

  const organizations = await getManageableOrganizations(actor)
  const selectedOrganizationId = actor.isGlobalAdmin ? input.organizationId : actor.organizationId
  const selectedOrganization = organizations.find(organization => organization.id === selectedOrganizationId)

  if (!selectedOrganization) {
    throw new Error("The selected organization is not available.")
  }

  const roles = await getRolesWithPermissions()
  const selectedRole = roles.find(role => role.id === input.roleId)
  if (!selectedRole) {
    throw new Error("The selected role is not available.")
  }

  if (!input.username.trim()) {
    throw new Error("Username is required.")
  }

  if (!input.email.trim()) {
    throw new Error("Email is required.")
  }

  if (!input.firstName.trim() || !input.lastName.trim()) {
    throw new Error("First name and last name are required.")
  }

  if (!input.entityIds.length) {
    throw new Error("At least one entity must be assigned.")
  }

  if (input.primaryEntityId && !input.entityIds.includes(input.primaryEntityId)) {
    throw new Error("Primary entity must be one of the assigned entities.")
  }

  const entityOptions = await getEntityOptionsForOrganizations([selectedOrganizationId])
  const validEntityIds = new Set(entityOptions.map(entity => entity.id))

  input.entityIds.forEach(entityId => {
    if (!validEntityIds.has(entityId)) {
      throw new Error("One or more selected entities are invalid.")
    }
  })

  const admin = createSupabaseAdminClient()
  const { data: duplicateUsernames, error: duplicateUsernameError } = await admin
    .from("profiles")
    .select("id")
    .eq("organization_id", selectedOrganizationId)
    .eq("username", input.username.trim().toLowerCase())

  if (duplicateUsernameError) {
    throw duplicateUsernameError
  }

  const hasDuplicateUsername = ((duplicateUsernames ?? []) as Array<{ id: string }>).some(
    candidate => candidate.id !== existingProfile?.id
  )

  if (hasDuplicateUsername) {
    throw new Error("That username is already in use for the selected organization.")
  }

  const existingAuthUser = await listAuthUsersByEmail(input.email.trim().toLowerCase())
  if (existingAuthUser && existingAuthUser.id !== existingProfile?.auth_user_id) {
    throw new Error("That email is already in use.")
  }

  return {
    organization: selectedOrganization,
    role: selectedRole,
    entityOptions,
  }
}

async function replaceEntityMemberships(profileId: string, organizationId: string, roleId: RoleId, entityIds: string[]) {
  const admin = createSupabaseAdminClient()

  await admin.from("entity_memberships").delete().eq("profile_id", profileId)

  if (!entityIds.length) {
    return
  }

  const inserts = entityIds.map(entityId => ({
    profile_id: profileId,
    entity_id: entityId,
    organization_id: organizationId,
    role_id: roleId,
  }))

  const { error } = await admin.from("entity_memberships").insert(inserts)
  if (error) {
    throw error
  }
}

async function recordUserAuditEvent(actor: AuthUser, targetProfileId: string, organizationId: string, action: string, details?: Record<string, unknown>) {
  const admin = createSupabaseAdminClient()

  const auditEntry = {
    id: createAuditId(`audit-${action}`),
    organization_id: organizationId,
    actor_profile_id: actor.impersonation?.actorProfileId ?? actor.id,
    target_profile_id: targetProfileId,
    action,
    entity_type: "profile",
    entity_id: targetProfileId,
    details: {
      actorEmail: actor.impersonation?.actorEmail ?? actor.email,
      actorUsername: actor.username,
      ...details,
    },
    created_at: new Date().toISOString(),
  }

  const activityEntry = {
    id: createAuditId(`activity-${action}`),
    organization_id: organizationId,
    profile_id: targetProfileId,
    type: action,
    title: action.replace(/\./g, " "),
    description: details?.summary ? String(details.summary) : null,
    related_type: "profile",
    related_id: targetProfileId,
    metadata: details ?? null,
    created_at: new Date().toISOString(),
  }

  await Promise.all([
    admin.from("audit_logs").upsert(auditEntry),
    admin.from("activity_events").upsert(activityEntry),
  ])
}

export async function listUsersForActor(actor: AuthUser, filters: UserListFilters): Promise<PaginatedResponse<User>> {
  const paginated = await getAccessibleUserRecords(actor, filters)
  return {
    ...paginated,
    data: paginated.data.map(toUser),
  }
}

export async function listManagedUsers(actor: AuthUser, filters: UserListFilters): Promise<PaginatedResponse<UserAccessRecord>> {
  requireUserManager(actor)
  return getAccessibleUserRecords(actor, filters)
}

export async function getUserAccessOptionsForActor(actor: AuthUser): Promise<UserAccessOptions> {
  requireUserManager(actor)
  const organizations = await getManageableOrganizations(actor)
  const roles = await getRolesWithPermissions()
  const entities = await getEntityOptionsForOrganizations(organizations.map(organization => organization.id))

  return {
    currentUser: {
      id: actor.id,
      organizationId: actor.organizationId,
      organizationSlug: actor.organizationSlug,
      isGlobalAdmin: actor.isGlobalAdmin,
      canManageUsers: isUserAdmin(actor),
    },
    organizations: organizations.map(toOrganization),
    entities,
    roles,
  }
}

export async function getManagedUserDetail(actor: AuthUser, profileId: string): Promise<UserAccessDetail> {
  const profile = await requireManagedProfile(actor, profileId)
  const [organizations, organizationMemberships, entityMemberships, roles, auditLogsResult, activityEventsResult] = await Promise.all([
    getOrganizationsByIds(profile.organization_id ? [profile.organization_id] : []),
    getOrganizationMemberships([profile.id]),
    getEntityMemberships([profile.id]),
    getRolesWithPermissions(),
    createSupabaseAdminClient()
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, target_profile_id, actor_profile_id, details, created_at")
      .eq("target_profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(6),
    createSupabaseAdminClient()
      .from("activity_events")
      .select("id, type, title, description, profile_id, metadata, created_at")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ])

  const entities = await getEntitiesByIds(entityMemberships.map(membership => membership.entity_id))
  const organizationMap = new Map(organizations.map(organization => [organization.id, organization]))
  const entityMap = new Map(entities.map(entity => [entity.id, entity]))
  const baseRecord = buildUserAccessRecord(
    profile,
    organizationMap,
    organizationMemberships,
    entityMemberships,
    entityMap
  )

  const selectedRole = roles.find(role => role.id === baseRecord.role)
  const recentActivity = [
    ...(((auditLogsResult.data ?? []) as AuditLogRow[]).map(item => ({
      id: item.id,
      type: "audit" as const,
      title: item.action.replace(/\./g, " "),
      description: item.entity_type ? `${item.entity_type} · ${item.entity_id ?? ""}`.trim() : undefined,
      createdAt: new Date(item.created_at),
    }))),
    ...(((activityEventsResult.data ?? []) as ActivityEventRow[]).map(item => ({
      id: item.id,
      type: "activity" as const,
      title: item.title,
      description: item.description ?? undefined,
      createdAt: new Date(item.created_at),
    }))),
  ]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 6)

  return {
    ...baseRecord,
    roleName: selectedRole?.name ?? baseRecord.role,
    roleDescription: selectedRole?.description ?? "",
    permissions: selectedRole?.permissions ?? [],
    entities: entities.map(entity =>
      toEntityOption(entity, organizationMap.get(entity.organization_id ?? "")?.name ?? "Unknown Organization")
    ),
    organization: toOrganization(organizationMap.get(baseRecord.organizationId)),
    recentActivity,
  }
}

export async function createManagedUser(actor: AuthUser, input: UserAccessFormInput): Promise<UserAccessDetail> {
  const normalizedInput: UserAccessFormInput = {
    ...input,
    organizationId: input.organizationId,
    username: input.username.trim().toLowerCase(),
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    title: input.title?.trim() || undefined,
    entityIds: Array.from(new Set(input.entityIds)),
    primaryEntityId: input.primaryEntityId || input.entityIds[0],
  }

  if (!normalizedInput.password?.trim()) {
    throw new Error("An initial password is required.")
  }

  const { organization, role } = await validateUserFormInput(actor, normalizedInput)
  const admin = createSupabaseAdminClient()
  const profileId = `u-${randomUUID()}`
  let authUserId: string | null = null
  let profileInserted = false

  try {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: normalizedInput.email,
      password: normalizedInput.password,
      email_confirm: true,
      user_metadata: {
        organization: organization.slug,
        username: normalizedInput.username,
        role: role.id,
      },
    })

    if (authError) {
      throw authError
    }

    authUserId = authData.user.id

    const { error: profileError } = await admin.from("profiles").insert({
      id: profileId,
      organization_id: organization.id,
      auth_user_id: authUserId,
      auth_email: normalizedInput.email,
      email: normalizedInput.email,
      username: normalizedInput.username,
      first_name: normalizedInput.firstName,
      last_name: normalizedInput.lastName,
      display_name: `${normalizedInput.firstName} ${normalizedInput.lastName}`.trim(),
      title: normalizedInput.title ?? null,
      status: normalizedInput.status,
      role_id: role.id,
      default_entity_id: normalizedInput.primaryEntityId ?? null,
      is_global_admin: false,
    })

    if (profileError) {
      throw profileError
    }

    profileInserted = true

    const { error: membershipError } = await admin.from("organization_memberships").upsert(
      {
        profile_id: profileId,
        organization_id: organization.id,
        role_id: role.id,
      },
      { onConflict: "profile_id,organization_id" }
    )

    if (membershipError) {
      throw membershipError
    }

    await replaceEntityMemberships(profileId, organization.id, role.id, normalizedInput.entityIds)

    const { error: preferenceError } = await admin.from("user_preferences").upsert(
      {
        profile_id: profileId,
        default_entity_id: normalizedInput.primaryEntityId ?? normalizedInput.entityIds[0] ?? null,
      },
      { onConflict: "profile_id" }
    )

    if (preferenceError) {
      throw preferenceError
    }

    await recordUserAuditEvent(actor, profileId, organization.id, "user.create", {
      username: normalizedInput.username,
      roleId: role.id,
      summary: `${normalizedInput.firstName} ${normalizedInput.lastName}`.trim(),
    })

    return getManagedUserDetail(actor, profileId)
  } catch (error) {
    if (profileInserted) {
      await admin.from("profiles").delete().eq("id", profileId)
    }
    if (authUserId) {
      await admin.auth.admin.deleteUser(authUserId)
    }
    throw error
  }
}

export async function updateManagedUser(actor: AuthUser, profileId: string, input: UserAccessFormInput): Promise<UserAccessDetail> {
  const existingProfile = await requireManagedProfile(actor, profileId)
  const normalizedInput: UserAccessFormInput = {
    ...input,
    organizationId: input.organizationId,
    username: input.username.trim().toLowerCase(),
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    title: input.title?.trim() || undefined,
    entityIds: Array.from(new Set(input.entityIds)),
    primaryEntityId: input.primaryEntityId || input.entityIds[0],
  }

  const { organization, role } = await validateUserFormInput(actor, normalizedInput, existingProfile)
  const admin = createSupabaseAdminClient()

  if (existingProfile.auth_user_id) {
    const { error: authError } = await admin.auth.admin.updateUserById(existingProfile.auth_user_id, {
      email: normalizedInput.email,
      password: normalizedInput.password?.trim() || undefined,
      user_metadata: {
        organization: organization.slug,
        username: normalizedInput.username,
        role: role.id,
      },
    })

    if (authError) {
      throw authError
    }
  }

  const { error: profileError } = await admin.from("profiles").update({
    organization_id: organization.id,
    auth_email: normalizedInput.email,
    email: normalizedInput.email,
    username: normalizedInput.username,
    first_name: normalizedInput.firstName,
    last_name: normalizedInput.lastName,
    display_name: `${normalizedInput.firstName} ${normalizedInput.lastName}`.trim(),
    title: normalizedInput.title ?? null,
    status: normalizedInput.status,
    role_id: role.id,
    default_entity_id: normalizedInput.primaryEntityId ?? null,
  }).eq("id", profileId)

  if (profileError) {
    throw profileError
  }

  const { error: membershipError } = await admin.from("organization_memberships").upsert(
    {
      profile_id: profileId,
      organization_id: organization.id,
      role_id: role.id,
    },
    { onConflict: "profile_id,organization_id" }
  )

  if (membershipError) {
    throw membershipError
  }

  await replaceEntityMemberships(profileId, organization.id, role.id, normalizedInput.entityIds)

  const { error: preferenceError } = await admin.from("user_preferences").upsert(
    {
      profile_id: profileId,
      default_entity_id: normalizedInput.primaryEntityId ?? normalizedInput.entityIds[0] ?? null,
    },
    { onConflict: "profile_id" }
  )

  if (preferenceError) {
    throw preferenceError
  }

  await recordUserAuditEvent(actor, profileId, organization.id, "user.update", {
    username: normalizedInput.username,
    roleId: role.id,
    summary: `${normalizedInput.firstName} ${normalizedInput.lastName}`.trim(),
  })

  return getManagedUserDetail(actor, profileId)
}

async function updateManagedUserStatus(actor: AuthUser, profileId: string, status: "active" | "inactive") {
  const profile = await requireManagedProfile(actor, profileId)
  const admin = createSupabaseAdminClient()
  const { error } = await admin.from("profiles").update({ status }).eq("id", profileId)
  if (error) {
    throw error
  }

  await recordUserAuditEvent(actor, profileId, profile.organization_id ?? actor.organizationId, `user.${status === "active" ? "reactivate" : "deactivate"}`, {
    status,
    summary: toDisplayName(profile),
  })

  return { success: true }
}

export async function deactivateManagedUser(actor: AuthUser, profileId: string) {
  return updateManagedUserStatus(actor, profileId, "inactive")
}

export async function reactivateManagedUser(actor: AuthUser, profileId: string) {
  return updateManagedUserStatus(actor, profileId, "active")
}

export async function resetManagedUserPassword(actor: AuthUser, profileId: string, password: string) {
  const profile = await requireManagedProfile(actor, profileId)
  if (!profile.auth_user_id) {
    throw new Error("This user does not have an auth account.")
  }

  if (!password.trim()) {
    throw new Error("A new password is required.")
  }

  const admin = createSupabaseAdminClient()
  const { error } = await admin.auth.admin.updateUserById(profile.auth_user_id, {
    password,
  })

  if (error) {
    throw error
  }

  await recordUserAuditEvent(actor, profileId, profile.organization_id ?? actor.organizationId, "user.password_reset", {
    summary: toDisplayName(profile),
  })

  return { success: true }
}

export async function listUsersForAdminPage(actor: AuthUser, filters: UserListFilters) {
  requireUserManager(actor)
  return getAccessibleUserRecords(actor, filters)
}

export function mapUserAccessRecordToUser(record: UserAccessRecord) {
  return toUser(record)
}
