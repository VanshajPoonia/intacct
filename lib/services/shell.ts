import type {
  DateRangeFilter,
  DateRangePreset,
  Role,
  RoleId,
  RoleShellConfig,
  ShellBreadcrumbDefinition,
  ShellBreadcrumbItem,
  ShellCommandGroup,
  ShellContextData,
  ShellDatePresetOption,
  ShellModule,
  ShellSidebarSection,
  ShellStubPage,
  User,
} from "@/lib/types"
import { fetchInternalApi } from "./internal-api"
import { getCurrentUser, getPreferences, getRoleHomeConfig } from "./identity"
import { getEntities } from "./master-data"
import { getRuntimeDataset } from "./runtime-data"
import { getWorkQueueSummary } from "./work-queue"

let currentUser: User | null = null
let roles: Role[] = []
let users: User[] = []
let roleShellConfigs: RoleShellConfig[] = []
let shellBreadcrumbDefinitions: ShellBreadcrumbDefinition[] = []
let shellCommandGroups: ShellCommandGroup[] = []
let shellDatePresetOptions: ShellDatePresetOption[] = []
let shellModules: ShellModule[] = []
let shellSidebarSections: ShellSidebarSection[] = []
let shellStubPages: ShellStubPage[] = []

async function ensureShellState() {
  const [identity, shell] = await Promise.all([
    getRuntimeDataset<{ currentUser: User; roles: Role[]; users: User[] }>("identity"),
    getRuntimeDataset<{
      roleShellConfigs: RoleShellConfig[]
      shellBreadcrumbDefinitions: ShellBreadcrumbDefinition[]
      shellCommandGroups: ShellCommandGroup[]
      shellDatePresetOptions: ShellDatePresetOption[]
      shellModules: ShellModule[]
      shellSidebarSections: ShellSidebarSection[]
      shellStubPages: ShellStubPage[]
    }>("shell"),
  ])

  currentUser = identity.currentUser
  roles = identity.roles
  users = identity.users
  roleShellConfigs = shell.roleShellConfigs
  shellBreadcrumbDefinitions = shell.shellBreadcrumbDefinitions
  shellCommandGroups = shell.shellCommandGroups
  shellDatePresetOptions = shell.shellDatePresetOptions
  shellModules = shell.shellModules
  shellSidebarSections = shell.shellSidebarSections
  shellStubPages = shell.shellStubPages
}

const canonicalRoleFallbacks: Partial<Record<RoleId, RoleId>> = {
  ap_clerk: 'ap_specialist',
  ar_clerk: 'ar_specialist',
  viewer: 'accountant',
}

function toCanonicalRoleId(roleId: RoleId): RoleId {
  return canonicalRoleFallbacks[roleId] ?? roleId
}

function cloneModule(module: ShellModule): ShellModule {
  return {
    ...module,
    groups: module.groups?.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        badge: item.badge ? { ...item.badge } : undefined,
      })),
    })),
    megaMenu: module.megaMenu?.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        badge: item.badge ? { ...item.badge } : undefined,
      })),
    })),
  }
}

function cloneSection(section: ShellSidebarSection): ShellSidebarSection {
  return {
    ...section,
    items: section.items.map(item => ({
      ...item,
      badge: item.badge ? { ...item.badge } : undefined,
      matchers: item.matchers ? [...item.matchers] : undefined,
    })),
  }
}

function cloneCommandGroup(group: ShellCommandGroup): ShellCommandGroup {
  return {
    ...group,
    items: group.items.map(item => ({
      ...item,
      badge: item.badge ? { ...item.badge } : undefined,
      keywords: item.keywords ? [...item.keywords] : undefined,
      roles: item.roles ? [...item.roles] : undefined,
    })),
  }
}

function matchPath(pattern: string, pathname: string) {
  const patternSegments = pattern.split('/').filter(Boolean)
  const pathSegments = pathname.split('/').filter(Boolean)

  if (patternSegments.length !== pathSegments.length) {
    return false
  }

  return patternSegments.every((segment, index) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      return Boolean(pathSegments[index])
    }
    return segment === pathSegments[index]
  })
}

function titleCaseSegment(segment: string) {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function getPresetRange(preset: DateRangePreset): DateRangeFilter {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (preset) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'this_week': {
      const day = now.getDay()
      const offset = day === 0 ? 6 : day - 1
      start.setDate(now.getDate() - offset)
      start.setHours(0, 0, 0, 0)
      end.setTime(start.getTime())
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'this_month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(now.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'this_quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      start.setMonth(quarterStartMonth, 1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(quarterStartMonth + 3, 0)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'this_year':
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(11, 31)
      end.setHours(23, 59, 59, 999)
      break
    case 'last_month':
      start.setMonth(now.getMonth() - 1, 1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(now.getMonth(), 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'last_quarter': {
      const currentQuarterStart = Math.floor(now.getMonth() / 3) * 3
      start.setMonth(currentQuarterStart - 3, 1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(currentQuarterStart, 0)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'last_year':
      start.setFullYear(now.getFullYear() - 1, 0, 1)
      start.setHours(0, 0, 0, 0)
      end.setFullYear(now.getFullYear() - 1, 11, 31)
      end.setHours(23, 59, 59, 999)
      break
    case 'custom':
    default:
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(now.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      break
  }

  return { startDate: start, endDate: end, preset }
}

function getRoleConfig(roleId: RoleId) {
  const canonicalRoleId = toCanonicalRoleId(roleId)
  return roleShellConfigs.find(config => config.roleId === canonicalRoleId)
}

function filterRoles(roleIds?: RoleId[]) {
  if (!roleIds?.length) {
    return roles.filter(role => getRoleConfig(role.id))
  }

  return roles.filter(role => roleIds.includes(toCanonicalRoleId(role.id)))
}

function findCurrentUserRecord(userId?: string): User {
  if (!currentUser) {
    throw new Error("Shell state has not been initialized.")
  }
  if (!userId) {
    return currentUser
  }
  return users.find(user => user.id === userId) ?? currentUser
}

function getVisibleRole(roleId: RoleId): Role {
  const canonicalRoleId = toCanonicalRoleId(roleId)
  return roles.find(role => role.id === canonicalRoleId) ?? roles[0]
}

function getBreadcrumbDefinition(pathname: string): ShellBreadcrumbDefinition | null {
  return (
    shellBreadcrumbDefinitions.find(definition => definition.path === pathname) ??
    shellBreadcrumbDefinitions.find(definition => matchPath(definition.path, pathname)) ??
    null
  )
}

function buildBreadcrumbTrail(definition: ShellBreadcrumbDefinition | null) {
  if (!definition) {
    return [] as ShellBreadcrumbDefinition[]
  }

  const trail: ShellBreadcrumbDefinition[] = []
  let cursor: ShellBreadcrumbDefinition | undefined | null = definition

  while (cursor) {
    trail.unshift(cursor)
    cursor = cursor.parentPath
      ? shellBreadcrumbDefinitions.find(candidate => candidate.path === cursor?.parentPath)
      : null
  }

  return trail
}

function buildFallbackTrail(pathname: string): ShellBreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const trail: ShellBreadcrumbItem[] = []
  let currentPath = ''

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    trail.push({
      label: titleCaseSegment(segment),
      href: index === segments.length - 1 ? undefined : currentPath,
    })
  })

  return trail
}

export async function getAvailableRoles(): Promise<Role[]> {
  await ensureShellState()
  return filterRoles(['accountant', 'ap_specialist', 'ar_specialist', 'controller', 'cfo', 'admin'])
}

export async function getShellContext(options?: {
  roleId?: RoleId
  entityId?: string
  datePreset?: DateRangePreset
  userId?: string
}): Promise<ShellContextData> {
  await ensureShellState()
  const [authUser, userPreferences, entities, availableRoles] = await Promise.all([
    getCurrentUser(),
    getPreferences(),
    getEntities(),
    getAvailableRoles(),
  ])

  const currentUserRecord = findCurrentUserRecord(options?.userId ?? authUser?.id)
  const mergedCurrentUser: User = {
    ...currentUserRecord,
    organizationId: authUser?.organizationId ?? currentUserRecord.organizationId,
    organizationSlug: authUser?.organizationSlug ?? currentUserRecord.organizationSlug,
    username: authUser?.username ?? currentUserRecord.username,
    role: authUser?.role ?? currentUserRecord.role,
    roleIds: authUser?.roleIds ?? currentUserRecord.roleIds,
    entityIds: authUser?.entityIds ?? currentUserRecord.entityIds,
    primaryEntityId: authUser?.primaryEntityId ?? currentUserRecord.primaryEntityId,
    isGlobalAdmin: authUser?.isGlobalAdmin ?? currentUserRecord.isGlobalAdmin,
    impersonation: authUser?.impersonation ?? currentUserRecord.impersonation,
    preferences: userPreferences,
  }
  const activeRole = getVisibleRole(options?.roleId ?? userPreferences.defaultRole ?? authUser?.role ?? currentUserRecord.role)
  const roleHomeConfig = await getRoleHomeConfig(activeRole.id)
  const preferredEntityId =
    options?.entityId ??
    userPreferences.defaultEntity ??
    mergedCurrentUser.primaryEntityId ??
    mergedCurrentUser.entityIds[0] ??
    entities[0]?.id

  const activeEntity =
    entities.find(entity => entity.id === preferredEntityId) ??
    entities.find(entity => mergedCurrentUser.entityIds.includes(entity.id)) ??
    entities[0]

  const activeDateRange = getPresetRange(options?.datePreset ?? userPreferences.defaultDateRange ?? 'this_month')
  const [notificationSummary, workQueueSummary] = await Promise.all([
    fetchInternalApi<{ unreadCount: number }>("/api/notifications/summary"),
    getWorkQueueSummary(
      {
        entityId: activeEntity?.id,
        dateRange: activeDateRange,
      },
      authUser?.id
    ),
  ])

  return {
    currentUser: mergedCurrentUser,
    availableRoles,
    activeRole,
    activeEntity,
    entities,
    dateRange: activeDateRange,
    roleHomeConfig,
    counts: {
      notifications: notificationSummary.unreadCount,
      tasks: workQueueSummary.totalCount,
    },
  }
}

export async function getTopModuleNav(roleId: RoleId): Promise<ShellModule[]> {
  await ensureShellState()
  const config = getRoleConfig(roleId)
  if (!config) {
    return []
  }

  return config.moduleIds
    .map(moduleId => shellModules.find(module => module.id === moduleId))
    .filter((module): module is ShellModule => Boolean(module))
    .map(cloneModule)
}

export async function getSidebarNav(roleId: RoleId): Promise<ShellSidebarSection[]> {
  await ensureShellState()
  const config = getRoleConfig(roleId)
  if (!config) {
    return []
  }

  return config.sidebarSectionIds
    .map(sectionId => shellSidebarSections.find(section => section.id === sectionId))
    .filter((section): section is ShellSidebarSection => Boolean(section))
    .map(cloneSection)
}

export async function getBreadcrumbs(pathname: string, roleId: RoleId): Promise<ShellBreadcrumbItem[]> {
  await ensureShellState()
  const config = getRoleConfig(roleId)
  const homeItem: ShellBreadcrumbItem = {
    label: config?.homeLabel ?? 'Home',
    href: pathname === '/' ? undefined : '/',
  }

  if (pathname === '/') {
    return [homeItem]
  }

  const definition = getBreadcrumbDefinition(pathname)
  const trail = definition
    ? buildBreadcrumbTrail(definition).map((item, index, items) => ({
        label: item.label,
        href: index === items.length - 1 ? undefined : item.href ?? item.path,
      }))
    : buildFallbackTrail(pathname)

  return [homeItem, ...trail]
}

export async function getCommandPaletteConfig(roleId: RoleId): Promise<ShellCommandGroup[]> {
  await ensureShellState()
  const config = getRoleConfig(roleId)
  const canonicalRoleId = toCanonicalRoleId(roleId)

  if (!config) {
    return []
  }

  return config.commandGroupIds
    .map(groupId => shellCommandGroups.find(group => group.id === groupId))
    .filter((group): group is ShellCommandGroup => Boolean(group))
    .map(cloneCommandGroup)
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.roles || item.roles.includes(canonicalRoleId)),
    }))
    .filter(group => group.items.length > 0)
}

export async function getStubPage(pathname: string, roleId: RoleId): Promise<ShellStubPage | null> {
  await ensureShellState()
  const canonicalRoleId = toCanonicalRoleId(roleId)
  const page = shellStubPages.find(candidate => candidate.path === pathname)

  if (!page) {
    return null
  }

  if (page.roleIds?.length && !page.roleIds.includes(canonicalRoleId)) {
    return null
  }

  return {
    ...page,
    primaryLinks: page.primaryLinks.map(link => ({
      ...link,
      badge: link.badge ? { ...link.badge } : undefined,
    })),
    roleIds: page.roleIds ? [...page.roleIds] : undefined,
    upcoming: [...page.upcoming],
  }
}

export async function getActiveModuleForPath(pathname: string, roleId: RoleId): Promise<ShellModule | null> {
  await ensureShellState()
  const modules = await getTopModuleNav(roleId)
  return (
    modules.find(module =>
      module.matchers.some(matcher => (matcher === '/' ? pathname === '/' : pathname.startsWith(matcher)))
    ) ?? null
  )
}

export async function getDatePresetOptions(): Promise<ShellDatePresetOption[]> {
  await ensureShellState()
  return shellDatePresetOptions.map(option => ({ ...option }))
}
