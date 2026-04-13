import type { AuthSession, AuthUser, Permission, Role, RoleHomeConfig, RoleId, UserPreferences } from "@/lib/types"
import { fetchInternalApi } from "./internal-api"
import { getRuntimeDataset } from "./runtime-data"

type SessionResponse = {
  user: AuthUser | null
  preferences: UserPreferences | null
}

async function getSessionPayload() {
  return fetchInternalApi<SessionResponse>("/api/auth/session")
}

type IdentityRuntimeDataset = {
  roles: Role[]
  rolePermissions: Array<{ roleId: RoleId; permissions: Permission[] }>
  roleHomeConfigs: RoleHomeConfig[]
}

async function getIdentityDataset() {
  return getRuntimeDataset<IdentityRuntimeDataset>("identity")
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSessionPayload()
  return session.user
}

export async function getUserRole(_userId?: string): Promise<Role | null> {
  const [session, identity] = await Promise.all([getSessionPayload(), getIdentityDataset()])
  if (!session.user) {
    return null
  }

  return identity.roles.find(role => role.id === session.user?.role) ?? null
}

export async function getRolePermissions(roleId?: RoleId): Promise<Permission[]> {
  const [session, identity] = await Promise.all([getSessionPayload(), getIdentityDataset()])
  const targetRoleId = roleId ?? session.user?.role
  if (!targetRoleId) {
    return []
  }

  return identity.rolePermissions.find(entry => entry.roleId === targetRoleId)?.permissions ?? []
}

export async function getRoleHomeConfig(roleId?: RoleId): Promise<RoleHomeConfig | null> {
  const [session, identity] = await Promise.all([getSessionPayload(), getIdentityDataset()])
  const targetRoleId = roleId ?? session.user?.role
  if (!targetRoleId) {
    return null
  }

  return identity.roleHomeConfigs.find(config => config.roleId === targetRoleId) ?? null
}

export async function login(
  organization: string,
  username: string,
  password: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ organization, username, password }),
  })

  const payload = (await response.json()) as { error?: string }
  if (!response.ok) {
    return { success: false, error: payload.error ?? "Invalid organization, username, or password." }
  }

  const sessionPayload = await getSessionPayload()
  if (!sessionPayload.user) {
    return { success: false, error: "Unable to load the authenticated user session." }
  }

  return {
    success: true,
    session: {
      user: sessionPayload.user,
    },
  }
}

export async function logout(): Promise<{ success: boolean }> {
  await fetch("/api/auth/logout", { method: "POST" })
  return { success: true }
}

export async function validateSession(_token?: string): Promise<boolean> {
  const session = await getSessionPayload()
  return Boolean(session.user)
}

export async function getPreferences(): Promise<UserPreferences> {
  const session = await getSessionPayload()
  if (!session.preferences) {
    return {
      theme: "system",
      defaultRole: undefined,
      defaultEntity: "e4",
      defaultDateRange: "this_month",
      sidebarCollapsed: false,
      notifications: {
        email: true,
        push: true,
        approvals: true,
        tasks: true,
      },
    }
  }

  return session.preferences
}

export async function updatePreferences(
  updates: Partial<UserPreferences>
): Promise<{ success: boolean; preferences: UserPreferences }> {
  const response = await fetch("/api/auth/preferences", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  })

  const payload = (await response.json()) as { success?: boolean; error?: string; preferences?: UserPreferences }

  if (!response.ok || !payload.preferences) {
    throw new Error(payload.error ?? "Failed to update preferences.")
  }

  return {
    success: true,
    preferences: payload.preferences,
  }
}

export async function resetPreferences(): Promise<{ success: boolean; preferences: UserPreferences }> {
  const response = await fetch("/api/auth/preferences", {
    method: "DELETE",
  })

  const payload = (await response.json()) as { success?: boolean; error?: string; preferences?: UserPreferences }

  if (!response.ok || !payload.preferences) {
    throw new Error(payload.error ?? "Failed to reset preferences.")
  }

  return {
    success: true,
    preferences: payload.preferences,
  }
}
