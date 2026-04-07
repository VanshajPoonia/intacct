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

const ROLE_STORAGE_KEY = "financeos.shell.role"
const ENTITY_STORAGE_KEY = "financeos.shell.entity"
const DATE_PRESET_STORAGE_KEY = "financeos.shell.date-preset"
const SIDEBAR_STORAGE_KEY = "financeos.shell.sidebar-collapsed"

const WorkspaceShellContext = createContext<WorkspaceShellContextValue | undefined>(undefined)

export function WorkspaceShellProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading: authLoading } = useAuth()

  const [isHydrated, setIsHydrated] = useState(false)
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
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const storedRole = window.localStorage.getItem(ROLE_STORAGE_KEY)
    const storedEntity = window.localStorage.getItem(ENTITY_STORAGE_KEY)
    const storedPreset = window.localStorage.getItem(DATE_PRESET_STORAGE_KEY)
    const storedSidebar = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)

    setRoleOverride(storedRole ? (storedRole as RoleId) : null)
    setEntityOverride(storedEntity || null)
    setDatePresetState(storedPreset ? (storedPreset as DateRangePreset) : null)
    setSidebarCollapsedState(storedSidebar === "true")
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (roleOverride) {
      window.localStorage.setItem(ROLE_STORAGE_KEY, roleOverride)
    } else {
      window.localStorage.removeItem(ROLE_STORAGE_KEY)
    }
  }, [isHydrated, roleOverride])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (entityOverride) {
      window.localStorage.setItem(ENTITY_STORAGE_KEY, entityOverride)
    } else {
      window.localStorage.removeItem(ENTITY_STORAGE_KEY)
    }
  }, [entityOverride, isHydrated])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (datePreset) {
      window.localStorage.setItem(DATE_PRESET_STORAGE_KEY, datePreset)
    } else {
      window.localStorage.removeItem(DATE_PRESET_STORAGE_KEY)
    }
  }, [datePreset, isHydrated])

  useEffect(() => {
    if (!isHydrated) {
      return
    }
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed))
  }, [isHydrated, sidebarCollapsed])

  useEffect(() => {
    if (!isHydrated || authLoading) {
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

      if (!entityOverride) {
        setEntityOverride(context.activeEntity.id)
      }

      if (!datePreset && context.dateRange.preset) {
        setDatePresetState(context.dateRange.preset)
      }

      if (window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === null) {
        setSidebarCollapsedState(context.currentUser.preferences?.sidebarCollapsed ?? false)
      }
    }

    loadShell().catch(() => {
      if (!cancelled) {
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [authLoading, datePreset, entityOverride, isHydrated, pathname, roleOverride, user?.id, user?.role])

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
      sidebarCollapsed,
      commandPaletteOpen,
      setActiveRole: roleId => setRoleOverride(roleId),
      setActiveEntity: entityId => setEntityOverride(entityId),
      setDatePreset: preset => setDatePresetState(preset),
      setSidebarCollapsed: collapsed => setSidebarCollapsedState(collapsed),
      toggleSidebar: () => setSidebarCollapsedState(previous => !previous),
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
      shellContext,
      sidebarCollapsed,
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
