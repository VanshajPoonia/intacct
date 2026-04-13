"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import {
  getBreadcrumbs,
  getCommandPaletteConfig,
  getDatePresetOptions,
  getShellContext,
  getSidebarNav,
  getTopModuleNav,
  updatePreferences,
} from "@/lib/services"
import type {
  DateRangeFilter,
  DateRangePreset,
  Entity,
  Role,
  RoleHomeConfig,
  RoleId,
  ShellBreadcrumbItem,
  ShellCommandGroup,
  ShellContextData,
  ShellDatePresetOption,
  ShellModule,
  ShellSidebarSection,
  ShellUtilityCounts,
  UserPreferences,
} from "@/lib/types"

interface WorkspaceShellContextValue {
  isInsideSharedShell: boolean
  isLoading: boolean
  shellContext: ShellContextData | null
  currentUser: ShellContextData["currentUser"] | null
  activeRole: Role | null
  roleHomeConfig: RoleHomeConfig | null
  availableRoles: Role[]
  activeEntity: Entity | null
  entities: Entity[]
  dateRange: DateRangeFilter | null
  datePresets: ShellDatePresetOption[]
  topModules: ShellModule[]
  sidebarSections: ShellSidebarSection[]
  commandGroups: ShellCommandGroup[]
  breadcrumbs: ShellBreadcrumbItem[]
  counts: ShellUtilityCounts
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  setActiveRole: (roleId: RoleId) => void
  setActiveEntity: (entityId: string) => void
  setDatePreset: (preset: DateRangePreset) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
}

const WorkspaceShellContext = createContext<WorkspaceShellContextValue | undefined>(undefined)

export function WorkspaceShellProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading: authLoading } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [shellContext, setShellContext] = useState<ShellContextData | null>(null)
  const [topModules, setTopModules] = useState<ShellModule[]>([])
  const [sidebarSections, setSidebarSections] = useState<ShellSidebarSection[]>([])
  const [commandGroups, setCommandGroups] = useState<ShellCommandGroup[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<ShellBreadcrumbItem[]>([])
  const [datePresets, setDatePresets] = useState<ShellDatePresetOption[]>([])
  const [roleOverride, setRoleOverride] = useState<RoleId | null>(null)
  const [entityOverride, setEntityOverride] = useState<string | null>(null)
  const [datePreset, setDatePresetState] = useState<DateRangePreset | null>(null)
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [pendingPreferenceUpdates, setPendingPreferenceUpdates] = useState<Partial<UserPreferences> | null>(null)

  useEffect(() => {
    if (!pendingPreferenceUpdates) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void updatePreferences(pendingPreferenceUpdates)
        .then(result => {
          setShellContext(previous =>
            previous
              ? {
                  ...previous,
                  currentUser: {
                    ...previous.currentUser,
                    preferences: result.preferences,
                  },
                }
              : previous
          )
        })
        .catch(() => undefined)
        .finally(() => {
          setPendingPreferenceUpdates(null)
        })
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [pendingPreferenceUpdates])

  useEffect(() => {
    if (authLoading) {
      return
    }

    let cancelled = false

    async function loadShell() {
      setIsLoading(true)

      const context = await getShellContext({
        roleId: roleOverride ?? user?.role,
        entityId: entityOverride ?? undefined,
        datePreset: datePreset ?? undefined,
        userId: user?.id,
      })

      const [modules, sections, groups, crumbs, presets] = await Promise.all([
        getTopModuleNav(context.activeRole.id),
        getSidebarNav(context.activeRole.id),
        getCommandPaletteConfig(context.activeRole.id),
        getBreadcrumbs(pathname, context.activeRole.id),
        getDatePresetOptions(),
      ])

      if (cancelled) {
        return
      }

      setShellContext(context)
      setTopModules(modules)
      setSidebarSections(sections)
      setCommandGroups(groups)
      setBreadcrumbs(crumbs)
      setDatePresets(presets)
      setIsLoading(false)

      setSidebarCollapsedState(previous => previous ?? context.currentUser.preferences?.sidebarCollapsed ?? false)
    }

    loadShell().catch(() => {
      if (!cancelled) {
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [authLoading, datePreset, entityOverride, pathname, roleOverride, user?.id, user?.role])

  const mergePreferenceUpdates = (updates: Partial<UserPreferences>) => {
    setPendingPreferenceUpdates(previous => ({
      ...previous,
      ...updates,
      notifications:
        updates.notifications || previous?.notifications
          ? {
              ...(previous?.notifications ?? {}),
              ...(updates.notifications ?? {}),
            }
          : undefined,
    }))
  }

  const resolvedSidebarCollapsed =
    sidebarCollapsed ?? shellContext?.currentUser.preferences?.sidebarCollapsed ?? false

  const value = useMemo<WorkspaceShellContextValue>(
    () => ({
      isInsideSharedShell: true,
      isLoading,
      shellContext,
      currentUser: shellContext?.currentUser ?? null,
      activeRole: shellContext?.activeRole ?? null,
      roleHomeConfig: shellContext?.roleHomeConfig ?? null,
      availableRoles: shellContext?.availableRoles ?? [],
      activeEntity: shellContext?.activeEntity ?? null,
      entities: shellContext?.entities ?? [],
      dateRange: shellContext?.dateRange ?? null,
      datePresets,
      topModules,
      sidebarSections,
      commandGroups,
      breadcrumbs,
      counts: shellContext?.counts ?? { notifications: 0, tasks: 0 },
      sidebarCollapsed: resolvedSidebarCollapsed,
      commandPaletteOpen,
      setActiveRole: roleId => {
        setRoleOverride(roleId)
        mergePreferenceUpdates({ defaultRole: roleId })
      },
      setActiveEntity: entityId => {
        setEntityOverride(entityId)
        mergePreferenceUpdates({ defaultEntity: entityId })
      },
      setDatePreset: preset => {
        setDatePresetState(preset)
        mergePreferenceUpdates({ defaultDateRange: preset })
      },
      setSidebarCollapsed: collapsed => {
        setSidebarCollapsedState(collapsed)
        mergePreferenceUpdates({ sidebarCollapsed: collapsed })
      },
      toggleSidebar: () => {
        const nextCollapsed = !resolvedSidebarCollapsed
        setSidebarCollapsedState(nextCollapsed)
        mergePreferenceUpdates({ sidebarCollapsed: nextCollapsed })
      },
      setCommandPaletteOpen: open => setCommandPaletteOpen(open),
      openCommandPalette: () => setCommandPaletteOpen(true),
      closeCommandPalette: () => setCommandPaletteOpen(false),
    }),
    [
      breadcrumbs,
      commandGroups,
      commandPaletteOpen,
      datePresets,
      isLoading,
      resolvedSidebarCollapsed,
      shellContext,
      sidebarSections,
      topModules,
    ]
  )

  return <WorkspaceShellContext.Provider value={value}>{children}</WorkspaceShellContext.Provider>
}

export function useWorkspaceShell() {
  const context = useContext(WorkspaceShellContext)
  if (!context) {
    throw new Error("useWorkspaceShell must be used within WorkspaceShellProvider")
  }
  return context
}

export function useWorkspaceShellOptional() {
  return useContext(WorkspaceShellContext)
}
