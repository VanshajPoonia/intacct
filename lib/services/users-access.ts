import type { PaginatedResponse, RoleId, SortConfig, User, UserAccessDetail, UserAccessFormInput, UserAccessOptions, UserAccessRecord } from "@/lib/types"
import { fetchInternalApi } from "./internal-api"

type UserAccessQuery = {
  search?: string
  organizationId?: string
  roleId?: string
  status?: string
  entityId?: string
  sort?: SortConfig
  page?: number
  pageSize?: number
}

type SerializableUser = Omit<User, "createdAt" | "lastLoginAt"> & {
  createdAt: string
  lastLoginAt?: string | null
}

type SerializableUserAccessRecord = Omit<UserAccessRecord, "createdAt" | "lastLoginAt"> & {
  createdAt: string
  lastLoginAt?: string | null
}

type SerializableUserAccessDetail = Omit<UserAccessDetail, "createdAt" | "lastLoginAt" | "recentActivity"> & {
  createdAt: string
  lastLoginAt?: string | null
  recentActivity: Array<
    Omit<UserAccessDetail["recentActivity"][number], "createdAt"> & {
      createdAt: string
    }
  >
}

function createQueryString(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value))
    }
  })
  return searchParams.toString()
}

function hydrateUser(record: SerializableUser): User {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    lastLoginAt: record.lastLoginAt ? new Date(record.lastLoginAt) : undefined,
  }
}

function hydrateUserAccessRecord(record: SerializableUserAccessRecord): UserAccessRecord {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    lastLoginAt: record.lastLoginAt ? new Date(record.lastLoginAt) : undefined,
  }
}

function hydrateUserAccessDetail(record: SerializableUserAccessDetail): UserAccessDetail {
  return {
    ...hydrateUserAccessRecord(record),
    roleName: record.roleName,
    roleDescription: record.roleDescription,
    permissions: record.permissions,
    entities: record.entities,
    organization: record.organization,
    recentActivity: record.recentActivity.map(item => ({
      ...item,
      createdAt: new Date(item.createdAt),
    })),
  }
}

function buildAdminUserPayload(input: UserAccessFormInput) {
  return {
    organizationId: input.organizationId,
    username: input.username,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    title: input.title,
    roleId: input.roleId,
    entityIds: input.entityIds,
    primaryEntityId: input.primaryEntityId,
    status: input.status,
    password: input.password,
  }
}

export async function getUsers(
  search?: string,
  role?: string[],
  status?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<User>> {
  const queryString = createQueryString({
    search,
    role: role?.[0],
    status: status?.[0],
    sortKey: sort?.key,
    sortDirection: sort?.direction,
    page,
    pageSize,
  })

  const response = await fetchInternalApi<PaginatedResponse<SerializableUser>>(`/api/users${queryString ? `?${queryString}` : ""}`)

  return {
    ...response,
    data: response.data.map(hydrateUser),
  }
}

export async function getUserAccessOptions(): Promise<UserAccessOptions> {
  return fetchInternalApi<UserAccessOptions>("/api/admin/access-options")
}

export async function getUserAccessRecords(query: UserAccessQuery = {}): Promise<PaginatedResponse<UserAccessRecord>> {
  const queryString = createQueryString({
    search: query.search,
    organizationId: query.organizationId,
    roleId: query.roleId,
    status: query.status,
    entityId: query.entityId,
    sortKey: query.sort?.key,
    sortDirection: query.sort?.direction,
    page: query.page,
    pageSize: query.pageSize,
  })

  const response = await fetchInternalApi<PaginatedResponse<SerializableUserAccessRecord>>(
    `/api/admin/users${queryString ? `?${queryString}` : ""}`
  )

  return {
    ...response,
    data: response.data.map(hydrateUserAccessRecord),
  }
}

export async function getUserById(id: string): Promise<UserAccessDetail> {
  const response = await fetchInternalApi<SerializableUserAccessDetail>(`/api/admin/users/${id}`)
  return hydrateUserAccessDetail(response)
}

export async function createUserAccessUser(input: UserAccessFormInput): Promise<UserAccessDetail> {
  const response = await fetchInternalApi<{ success: boolean; user: SerializableUserAccessDetail }>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(buildAdminUserPayload(input)),
  })

  return hydrateUserAccessDetail(response.user)
}

export async function updateUserAccessUser(id: string, input: UserAccessFormInput): Promise<UserAccessDetail> {
  const response = await fetchInternalApi<{ success: boolean; user: SerializableUserAccessDetail }>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(buildAdminUserPayload(input)),
  })

  return hydrateUserAccessDetail(response.user)
}

export async function deactivateUser(id: string): Promise<{ success: boolean }> {
  return fetchInternalApi<{ success: boolean }>(`/api/admin/users/${id}/deactivate`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

export async function reactivateUser(id: string): Promise<{ success: boolean }> {
  return fetchInternalApi<{ success: boolean }>(`/api/admin/users/${id}/reactivate`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

export async function resetUserPassword(id: string, password: string): Promise<{ success: boolean }> {
  return fetchInternalApi<{ success: boolean }>(`/api/admin/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  })
}

export async function impersonateUser(profileId: string): Promise<{ success: boolean }> {
  return fetchInternalApi<{ success: boolean }>("/api/auth/impersonate", {
    method: "POST",
    body: JSON.stringify({ profileId }),
  })
}

export async function stopUserImpersonation(): Promise<{ success: boolean }> {
  return fetchInternalApi<{ success: boolean }>("/api/auth/stop-impersonation", {
    method: "POST",
    body: JSON.stringify({}),
  })
}

export async function createUser(
  input: Partial<User> & {
    organizationId?: string
    username?: string
    title?: string
    roleId?: RoleId
    primaryEntityId?: string
    password?: string
  }
): Promise<{ success: boolean; user?: User }> {
  const detail = await createUserAccessUser({
    organizationId: input.organizationId ?? "",
    username: input.username ?? input.email?.split("@")[0] ?? "",
    email: input.email ?? "",
    firstName: input.firstName ?? "",
    lastName: input.lastName ?? "",
    title: input.title,
    roleId: (input.roleId ?? input.role ?? "viewer") as RoleId,
    entityIds: input.entityIds ?? [],
    primaryEntityId: input.primaryEntityId ?? input.entityIds?.[0],
    status: input.status ?? "pending",
    password: input.password ?? "TempPass123!",
  })

  return {
    success: true,
    user: hydrateUser({
      ...detail,
      createdAt: detail.createdAt.toISOString(),
      lastLoginAt: detail.lastLoginAt?.toISOString() ?? null,
    } as SerializableUser),
  }
}

export async function updateUser(
  id: string,
  input: Partial<User> & {
    organizationId?: string
    username?: string
    title?: string
    roleId?: RoleId
    primaryEntityId?: string
    password?: string
  }
): Promise<{ success: boolean }> {
  const current = await getUserById(id)
  await updateUserAccessUser(id, {
    organizationId: input.organizationId ?? current.organizationId,
    username: input.username ?? current.username,
    email: input.email ?? current.email,
    firstName: input.firstName ?? current.firstName,
    lastName: input.lastName ?? current.lastName,
    title: input.title ?? current.title,
    roleId: (input.roleId ?? input.role ?? current.role) as RoleId,
    entityIds: input.entityIds ?? current.entityIds,
    primaryEntityId: input.primaryEntityId ?? current.primaryEntityId,
    status: input.status ?? current.status,
    password: input.password,
  })

  return { success: true }
}
