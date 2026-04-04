import { currentUser, roleHomeConfigs, rolePermissions, roles, users } from '@/lib/mock-data/identity'
import type { AuthSession, AuthUser, Permission, Role, RoleHomeConfig, RoleId, User, UserPreferences } from '@/lib/types'
import { delay } from './base'

const demoCredentials = new Map<string, string>([
  ['ava.mitchell@northstarfinance.com', 'demo123'],
  ['miles.chen@northstarfinance.com', 'demo123'],
  ['lena.garcia@northstarfinance.com', 'demo123'],
  ['owen.price@northstarfinance.com', 'demo123'],
  ['nina.shah@northstarfinance.com', 'demo123'],
  ['noah.wells@northstarfinance.com', 'demo123'],
  ['demo@intacct.com', 'demo'],
])

let preferencesState: UserPreferences = currentUser.preferences ?? {
  theme: 'system',
  defaultEntity: currentUser.primaryEntityId ?? currentUser.entityIds[0] ?? 'e4',
  defaultDateRange: 'this_month',
  sidebarCollapsed: false,
  notifications: {
    email: true,
    push: true,
    approvals: true,
    tasks: true,
  },
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar,
    entityIds: user.entityIds,
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  await delay()
  return toAuthUser(currentUser)
}

export async function getUserRole(userId: string = currentUser.id): Promise<Role | null> {
  await delay()
  const user = users.find(candidate => candidate.id === userId)
  if (!user) {
    return null
  }
  return roles.find(role => role.id === user.role) ?? null
}

export async function getRolePermissions(roleId: RoleId = currentUser.role): Promise<Permission[]> {
  await delay()
  return rolePermissions.find(entry => entry.roleId === roleId)?.permissions ?? []
}

export async function getRoleHomeConfig(roleId: RoleId = currentUser.role): Promise<RoleHomeConfig | null> {
  await delay()
  return roleHomeConfigs.find(config => config.roleId === roleId) ?? null
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  await delay(120)

  const normalizedEmail = email.toLowerCase()
  const expectedPassword = demoCredentials.get(normalizedEmail)

  if (!expectedPassword || expectedPassword !== password) {
    return { success: false, error: 'Invalid email or password' }
  }

  const matchedUser =
    users.find(user => user.email.toLowerCase() === normalizedEmail) ??
    currentUser

  return {
    success: true,
    session: {
      user: toAuthUser(matchedUser),
      accessToken: `mock_token_${matchedUser.id}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  }
}

export async function logout(): Promise<{ success: boolean }> {
  await delay()
  return { success: true }
}

export async function validateSession(token: string): Promise<boolean> {
  await delay()
  return token.startsWith('mock_token_')
}

export async function getPreferences(): Promise<UserPreferences> {
  await delay()
  return { ...preferencesState }
}

export async function updatePreferences(
  updates: Partial<UserPreferences>
): Promise<{ success: boolean; preferences: UserPreferences }> {
  await delay()
  preferencesState = {
    ...preferencesState,
    ...updates,
    notifications: {
      ...preferencesState.notifications,
      ...updates.notifications,
    },
  }

  return { success: true, preferences: { ...preferencesState } }
}

export async function resetPreferences(): Promise<{ success: boolean; preferences: UserPreferences }> {
  await delay()
  preferencesState = currentUser.preferences ?? preferencesState
  return { success: true, preferences: { ...preferencesState } }
}
