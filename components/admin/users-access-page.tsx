"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { SideDrawer } from "@/components/finance/side-drawer"
import { ConfirmDialog, Modal } from "@/components/finance/modal"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/context"
import {
  createUserAccessUser,
  deactivateUser,
  getUserAccessOptions,
  getUserAccessRecords,
  getUserById,
  impersonateUser,
  reactivateUser,
  resetUserPassword,
  stopUserImpersonation,
  updateUserAccessUser,
} from "@/lib/services"
import type {
  RoleId,
  UserAccessDetail,
  UserAccessEntityOption,
  UserAccessFormInput,
  UserAccessOptions,
  UserAccessRecord,
  UserAccessRoleOption,
} from "@/lib/types"
import {
  ArrowRightLeft,
  BadgeCheck,
  Building2,
  KeyRound,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react"

type UserFormState = UserAccessFormInput

type FormMode = "create" | "edit"

function formatDate(value?: Date) {
  if (!value) {
    return "Never"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value)
}

function formatDateTime(value?: Date) {
  if (!value) {
    return "Never"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value)
}

function getStatusBadgeClass(status: UserAccessRecord["status"]) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "inactive":
      return "bg-slate-100 text-slate-700 border-slate-200"
  }
}

function getInitials(record: Pick<UserAccessRecord, "firstName" | "lastName" | "displayName">) {
  const fallback = record.displayName.trim().slice(0, 2)
  return `${record.firstName[0] ?? ""}${record.lastName[0] ?? ""}`.toUpperCase() || fallback.toUpperCase()
}

function createEmptyForm(options: UserAccessOptions): UserFormState {
  const defaultOrganization = options.organizations[0]
  const orgEntities = options.entities.filter(entity => entity.organizationId === defaultOrganization?.id)
  const defaultEntity = orgEntities[0]
  const defaultRole = options.roles[0]?.id ?? "viewer"

  return {
    organizationId: defaultOrganization?.id ?? "",
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    title: "",
    roleId: defaultRole,
    entityIds: defaultEntity ? [defaultEntity.id] : [],
    primaryEntityId: defaultEntity?.id,
    status: "active",
    password: "",
  }
}

function createEditForm(detail: UserAccessDetail): UserFormState {
  return {
    organizationId: detail.organizationId,
    username: detail.username,
    email: detail.email,
    firstName: detail.firstName,
    lastName: detail.lastName,
    title: detail.title ?? "",
    roleId: detail.role,
    entityIds: detail.entityIds,
    primaryEntityId: detail.primaryEntityId,
    status: detail.status,
    password: "",
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Something went wrong."
}

function UserFormModal({
  open,
  onOpenChange,
  mode,
  options,
  initialValue,
  isLoading,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: FormMode
  options: UserAccessOptions
  initialValue: UserFormState
  isLoading: boolean
  onSubmit: (value: UserFormState) => Promise<void>
}) {
  const [value, setValue] = useState<UserFormState>(initialValue)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValue(initialValue)
    setError(null)
  }, [initialValue, open])

  const selectedRole = useMemo(
    () => options.roles.find(role => role.id === value.roleId),
    [options.roles, value.roleId]
  )

  const availableEntities = useMemo(
    () => options.entities.filter(entity => entity.organizationId === value.organizationId),
    [options.entities, value.organizationId]
  )

  const isOrganizationLocked = !options.currentUser.isGlobalAdmin

  const handleEntityToggle = (entityId: string, checked: boolean) => {
    const nextEntityIds = checked
      ? Array.from(new Set([...value.entityIds, entityId]))
      : value.entityIds.filter(currentId => currentId !== entityId)

    setValue(previousValue => ({
      ...previousValue,
      entityIds: nextEntityIds,
      primaryEntityId:
        nextEntityIds.includes(previousValue.primaryEntityId ?? "")
          ? previousValue.primaryEntityId
          : nextEntityIds[0],
    }))
  }

  const handleSubmit = async () => {
    if (!value.organizationId) {
      setError("Organization is required.")
      return
    }

    if (!value.username.trim() || !value.email.trim()) {
      setError("Username and email are required.")
      return
    }

    if (!value.firstName.trim() || !value.lastName.trim()) {
      setError("First name and last name are required.")
      return
    }

    if (!value.entityIds.length) {
      setError("Assign at least one entity.")
      return
    }

    if (mode === "create" && !value.password?.trim()) {
      setError("Initial password is required.")
      return
    }

    try {
      setError(null)
      await onSubmit({
        ...value,
        username: value.username.trim().toLowerCase(),
        email: value.email.trim().toLowerCase(),
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        title: value.title?.trim(),
        password: value.password?.trim() || undefined,
      })
      onOpenChange(false)
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add User" : "Edit User"}
      description="Manage the user's identity, organization scope, and entity access."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === "create" ? "Create User" : "Save Changes"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <div className="space-y-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="organization">Organization</Label>
              <Select
                value={value.organizationId}
                onValueChange={organizationId => {
                  const nextEntities = options.entities.filter(entity => entity.organizationId === organizationId)
                  setValue(previousValue => ({
                    ...previousValue,
                    organizationId,
                    entityIds: nextEntities[0] ? [nextEntities[0].id] : [],
                    primaryEntityId: nextEntities[0]?.id,
                  }))
                }}
                disabled={isOrganizationLocked}
              >
                <SelectTrigger id="organization">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {options.organizations.map(organization => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={value.roleId}
                onValueChange={roleId => setValue(previousValue => ({ ...previousValue, roleId: roleId as RoleId }))}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {options.roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={value.firstName}
                onChange={event => setValue(previousValue => ({ ...previousValue, firstName: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={value.lastName}
                onChange={event => setValue(previousValue => ({ ...previousValue, lastName: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoCapitalize="none"
                value={value.username}
                onChange={event => setValue(previousValue => ({ ...previousValue, username: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoCapitalize="none"
                value={value.email}
                onChange={event => setValue(previousValue => ({ ...previousValue, email: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={value.title ?? ""}
                onChange={event => setValue(previousValue => ({ ...previousValue, title: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={value.status}
                onValueChange={status => setValue(previousValue => ({ ...previousValue, status: status as UserFormState["status"] }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">{mode === "create" ? "Initial Password" : "New Password (Optional)"}</Label>
            <Input
              id="password"
              type="password"
              value={value.password ?? ""}
              onChange={event => setValue(previousValue => ({ ...previousValue, password: event.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="primary-entity">Primary Entity</Label>
            <Select
              value={value.primaryEntityId ?? ""}
              onValueChange={primaryEntityId => setValue(previousValue => ({ ...previousValue, primaryEntityId }))}
            >
              <SelectTrigger id="primary-entity">
                <SelectValue placeholder="Select primary entity" />
              </SelectTrigger>
              <SelectContent>
                {availableEntities
                  .filter(entity => value.entityIds.includes(entity.id))
                  .map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Entity Access</Label>
            <ScrollArea className="h-56 rounded-md border">
              <div className="space-y-2 p-3">
                {availableEntities.map(entity => {
                  const checked = value.entityIds.includes(entity.id)
                  return (
                    <label key={entity.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={nextValue => handleEntityToggle(entity.id, nextValue === true)}
                      />
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{entity.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {entity.code} · {entity.type}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Role Summary</CardTitle>
            <CardDescription>
              Permissions stay read-only in this release and come from the selected role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-medium text-foreground">{selectedRole?.name ?? "No role selected"}</div>
              <div className="text-sm text-muted-foreground">{selectedRole?.description ?? "Select a role to view permissions."}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedRole?.permissions.map(permission => (
                <Badge key={permission.id} variant="outline" className="rounded-sm">
                  {permission.label}
                </Badge>
              ))}
              {!selectedRole?.permissions.length ? (
                <div className="text-sm text-muted-foreground">No permissions configured.</div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </Modal>
  )
}

export function UsersAccessPage() {
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  const [options, setOptions] = useState<UserAccessOptions | null>(null)
  const [records, setRecords] = useState<UserAccessRecord[]>([])
  const [detail, setDetail] = useState<UserAccessDetail | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [organizationFilter, setOrganizationFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<FormMode>("create")
  const [formOpen, setFormOpen] = useState(false)
  const [formValue, setFormValue] = useState<UserFormState | null>(null)
  const [resetTarget, setResetTarget] = useState<UserAccessRecord | null>(null)
  const [resetPassword, setResetPassword] = useState("")
  const [confirmAction, setConfirmAction] = useState<{ type: "deactivate" | "reactivate"; record: UserAccessRecord } | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)

  const loadOptions = useCallback(async () => {
    const nextOptions = await getUserAccessOptions()
    setOptions(nextOptions)
    return nextOptions
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getUserAccessRecords({
        search,
        organizationId: organizationFilter !== "all" ? organizationFilter : undefined,
        roleId: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        entityId: entityFilter !== "all" ? entityFilter : undefined,
        sort: { key: "createdAt", direction: "desc" },
        page: 1,
        pageSize: 200,
      })
      setRecords(response.data)
      setSelectedIds(previousValue => previousValue.filter(id => response.data.some(record => record.id === id)))
      setPageError(null)
    } catch (error) {
      setPageError(getErrorMessage(error))
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [entityFilter, organizationFilter, roleFilter, search, statusFilter])

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const nextDetail = await getUserById(id)
      setDetail(nextDetail)
      setSelectedRecordId(id)
    } catch (error) {
      toast({
        title: "Unable to load user",
        description: getErrorMessage(error),
        variant: "destructive",
      })
      setSelectedRecordId(null)
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [toast])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const nextOptions = await loadOptions()
        if (cancelled) {
          return
        }

        if (!nextOptions.currentUser.isGlobalAdmin) {
          setOrganizationFilter(nextOptions.currentUser.organizationId)
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(getErrorMessage(error))
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [loadOptions])

  useEffect(() => {
    if (!options) {
      return
    }

    void loadUsers()
  }, [loadUsers, options])

  useEffect(() => {
    if (!selectedRecordId) {
      return
    }

    const stillVisible = records.some(record => record.id === selectedRecordId)
    if (!stillVisible) {
      setSelectedRecordId(null)
      setDetail(null)
    }
  }, [records, selectedRecordId])

  const metrics = useMemo(() => {
    const active = records.filter(record => record.status === "active").length
    const pending = records.filter(record => record.status === "pending").length
    const inactive = records.filter(record => record.status === "inactive").length

    return [
      { label: "Visible Users", value: records.length, detail: "Current filter scope" },
      { label: "Active", value: active, detail: "Can sign in" },
      { label: "Pending", value: pending, detail: "Awaiting activation" },
      { label: "Inactive", value: inactive, detail: "Disabled accounts" },
    ]
  }, [records])

  const openCreateModal = () => {
    if (!options) {
      return
    }

    setFormMode("create")
    setFormValue(createEmptyForm(options))
    setFormOpen(true)
  }

  const openEditModal = async (record: UserAccessRecord) => {
    setFormMode("edit")
    setSaving(true)
    try {
      const nextDetail = detail?.id === record.id ? detail : await getUserById(record.id)
      setFormValue(createEditForm(nextDetail))
      setDetail(nextDetail)
      setSelectedRecordId(record.id)
      setFormOpen(true)
    } catch (error) {
      toast({
        title: "Unable to open editor",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitForm = async (value: UserFormState) => {
    setSaving(true)
    try {
      if (formMode === "create") {
        await createUserAccessUser(value)
        toast({
          title: "User created",
          description: `${value.firstName} ${value.lastName} can now sign in with the assigned organization and username.`,
        })
      } else if (selectedRecordId) {
        await updateUserAccessUser(selectedRecordId, value)
        toast({
          title: "User updated",
          description: "Identity and access settings are now in sync.",
        })
      }

      await loadUsers()
      if (selectedRecordId && formMode === "edit") {
        await loadDetail(selectedRecordId)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (record: UserAccessRecord, nextStatus: "active" | "inactive") => {
    setActionLoadingId(record.id)
    try {
      if (nextStatus === "active") {
        await reactivateUser(record.id)
      } else {
        await deactivateUser(record.id)
      }

      toast({
        title: nextStatus === "active" ? "User reactivated" : "User deactivated",
        description: `${record.displayName} is now ${nextStatus}.`,
      })

      await loadUsers()
      if (detail?.id === record.id) {
        await loadDetail(record.id)
      }
    } catch (error) {
      toast({
        title: "Action failed",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setActionLoadingId(null)
      setConfirmAction(null)
    }
  }

  const handleBulkStatusChange = async (nextStatus: "active" | "inactive") => {
    const selectedRecords = records.filter(record => selectedIds.includes(record.id))
    if (!selectedRecords.length) {
      return
    }

    setActionLoadingId(nextStatus)
    try {
      await Promise.all(
        selectedRecords.map(record => nextStatus === "active" ? reactivateUser(record.id) : deactivateUser(record.id))
      )

      toast({
        title: nextStatus === "active" ? "Users reactivated" : "Users deactivated",
        description: `${selectedRecords.length} user${selectedRecords.length === 1 ? "" : "s"} updated.`,
      })

      setSelectedIds([])
      await loadUsers()
      if (selectedRecordId && selectedIds.includes(selectedRecordId)) {
        await loadDetail(selectedRecordId)
      }
    } catch (error) {
      toast({
        title: "Bulk action failed",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleResetPassword = async () => {
    if (!resetTarget || !resetPassword.trim()) {
      return
    }

    setActionLoadingId(resetTarget.id)
    try {
      await resetUserPassword(resetTarget.id, resetPassword)
      toast({
        title: "Password reset",
        description: `The new password is active for ${resetTarget.displayName}.`,
      })
      setResetTarget(null)
      setResetPassword("")
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleImpersonate = async (record: UserAccessRecord) => {
    setActionLoadingId(record.id)
    try {
      await impersonateUser(record.id)
      window.location.assign("/")
    } catch (error) {
      toast({
        title: "Unable to impersonate user",
        description: getErrorMessage(error),
        variant: "destructive",
      })
      setActionLoadingId(null)
    }
  }

  const handleStopImpersonating = async () => {
    setActionLoadingId("stop-impersonation")
    try {
      await stopUserImpersonation()
      window.location.assign("/admin/users")
    } catch (error) {
      toast({
        title: "Unable to stop impersonation",
        description: getErrorMessage(error),
        variant: "destructive",
      })
      setActionLoadingId(null)
    }
  }

  const filteredEntityOptions = useMemo(() => {
    if (!options) {
      return []
    }

    if (organizationFilter === "all") {
      return options.entities
    }

    return options.entities.filter(entity => entity.organizationId === organizationFilter)
  }, [options, organizationFilter])

  const canManageUsers = options?.currentUser.canManageUsers ?? false

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Users &amp; Access</h1>
            <p className="text-sm text-muted-foreground">
              Manage real Supabase-backed users, organization access, entity scope, and impersonation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => void loadUsers()} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={openCreateModal} disabled={!canManageUsers || !options}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {currentUser?.impersonation ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-medium text-amber-900">Impersonation active</div>
                <div className="text-sm text-amber-800">
                  You are currently acting as another user. Stop impersonation to return to your admin session.
                </div>
              </div>
              <Button variant="outline" onClick={() => void handleStopImpersonating()} disabled={actionLoadingId === "stop-impersonation"}>
                {actionLoadingId === "stop-impersonation" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                Stop Impersonating
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map(metric => (
            <Card key={metric.label}>
              <CardHeader className="pb-2">
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-2xl">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{metric.detail}</CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-lg">User Directory</CardTitle>
                <CardDescription>
                  Search identities, adjust entity scope, and control account status from one place.
                </CardDescription>
              </div>
              {selectedIds.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-sm px-2 py-1">
                    {selectedIds.length} selected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleBulkStatusChange("active")}
                    disabled={Boolean(actionLoadingId)}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Reactivate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleBulkStatusChange("inactive")}
                    disabled={Boolean(actionLoadingId)}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(150px,1fr))]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search users, usernames, emails, and organizations"
                  className="pl-9"
                />
              </div>

              {options?.currentUser.isGlobalAdmin ? (
                <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All organizations</SelectItem>
                    {options.organizations.map(organization => (
                      <SelectItem key={organization.id} value={organization.id}>
                        {organization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="hidden xl:block" />
              )}

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {options?.roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  {filteredEntityOptions.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(item => (
                  <Skeleton key={item} className="h-12 w-full" />
                ))}
              </div>
            ) : pageError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {pageError}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={records.length > 0 && selectedIds.length === records.length}
                          onCheckedChange={checked =>
                            setSelectedIds(checked === true ? records.map(record => record.id) : [])
                          }
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Primary Entity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map(record => (
                      <TableRow key={record.id} className="cursor-pointer" onClick={() => void loadDetail(record.id)}>
                        <TableCell onClick={event => event.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(record.id)}
                            onCheckedChange={checked =>
                              setSelectedIds(previousValue =>
                                checked === true
                                  ? Array.from(new Set([...previousValue, record.id]))
                                  : previousValue.filter(id => id !== record.id)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>{getInitials(record)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="font-medium text-foreground">{record.displayName}</div>
                              <div className="text-xs text-muted-foreground">{record.username} · {record.email}</div>
                              {record.title ? <div className="text-xs text-muted-foreground">{record.title}</div> : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm text-foreground">{record.role.replace(/_/g, " ")}</div>
                            <div className="text-xs text-muted-foreground">{record.entityIds.length} entities</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">{record.organizationName}</div>
                          <div className="text-xs text-muted-foreground">{record.organizationSlug}</div>
                        </TableCell>
                        <TableCell className="text-sm text-foreground">{record.primaryEntityName ?? "Unassigned"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadgeClass(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(record.lastLoginAt)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(record.createdAt)}</TableCell>
                        <TableCell onClick={event => event.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => void openEditModal(record)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setResetTarget(record)
                                  setResetPassword("")
                                }}
                              >
                                Reset Password
                              </DropdownMenuItem>
                              {options?.currentUser.isGlobalAdmin ? (
                                <DropdownMenuItem
                                  disabled={record.status !== "active" || Boolean(actionLoadingId)}
                                  onClick={() => void handleImpersonate(record)}
                                >
                                  Impersonate
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setConfirmAction({ type: record.status === "active" ? "deactivate" : "reactivate", record })}
                              >
                                {record.status === "active" ? "Deactivate" : "Reactivate"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!records.length ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-28 text-center text-sm text-muted-foreground">
                          No users match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <SideDrawer
          open={Boolean(selectedRecordId)}
          onOpenChange={open => {
            if (!open) {
              setSelectedRecordId(null)
              setDetail(null)
            }
          }}
          title={detail?.displayName ?? "User Details"}
          description={detail ? `${detail.username} · ${detail.email}` : "Review access, roles, and recent audit activity."}
          size="lg"
        >
          {detailLoading || !detail ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={getStatusBadgeClass(detail.status)}>
                  {detail.status}
                </Badge>
                <Badge variant="outline">
                  <Building2 className="mr-1 h-3 w-3" />
                  {detail.organizationName}
                </Badge>
                <Badge variant="outline">
                  <Shield className="mr-1 h-3 w-3" />
                  {detail.roleName}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void openEditModal(detail)} disabled={saving}>
                  Edit User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResetTarget(detail)
                    setResetPassword("")
                  }}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Password
                </Button>
                {options?.currentUser.isGlobalAdmin ? (
                  <Button
                    variant="outline"
                    disabled={detail.status !== "active" || Boolean(actionLoadingId)}
                    onClick={() => void handleImpersonate(detail)}
                  >
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Impersonate
                  </Button>
                ) : null}
                <Button
                  variant={detail.status === "active" ? "destructive" : "outline"}
                  onClick={() => setConfirmAction({ type: detail.status === "active" ? "deactivate" : "reactivate", record: detail })}
                >
                  {detail.status === "active" ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Reactivate
                    </>
                  )}
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Identity</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground">Display name</div>
                    <div className="font-medium text-foreground">{detail.displayName}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Title</div>
                    <div className="font-medium text-foreground">{detail.title ?? "None"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Username</div>
                    <div className="font-medium text-foreground">{detail.username}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium text-foreground">{detail.email}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Created</div>
                    <div className="font-medium text-foreground">{formatDateTime(detail.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last login</div>
                    <div className="font-medium text-foreground">{formatDateTime(detail.lastLoginAt)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Organization &amp; Entity Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-sm font-medium text-foreground">{detail.organization.name}</div>
                    <div className="text-xs text-muted-foreground">{detail.organization.slug}</div>
                  </div>
                  <div className="space-y-2">
                    {detail.entities.map(entity => (
                      <div key={entity.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium text-foreground">{entity.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {entity.code} · {entity.type}
                          </div>
                        </div>
                        {detail.primaryEntityId === entity.id ? (
                          <Badge variant="outline">
                            <BadgeCheck className="mr-1 h-3 w-3" />
                            Primary
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Role &amp; Permissions</CardTitle>
                  <CardDescription>{detail.roleDescription}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {detail.permissions.map(permission => (
                    <Badge key={permission.id} variant="outline">
                      {permission.label}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Audit &amp; Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {detail.recentActivity.map(item => (
                    <div key={item.id} className="rounded-md border px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</div>
                      </div>
                      {item.description ? (
                        <div className="mt-1 text-sm text-muted-foreground">{item.description}</div>
                      ) : null}
                    </div>
                  ))}
                  {!detail.recentActivity.length ? (
                    <div className="text-sm text-muted-foreground">No recent audit activity for this user yet.</div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}
        </SideDrawer>

        {options && formValue ? (
          <UserFormModal
            open={formOpen}
            onOpenChange={setFormOpen}
            mode={formMode}
            options={options}
            initialValue={formValue}
            isLoading={saving}
            onSubmit={handleSubmitForm}
          />
        ) : null}

        <Modal
          open={Boolean(resetTarget)}
          onOpenChange={open => {
            if (!open) {
              setResetTarget(null)
              setResetPassword("")
            }
          }}
          title="Reset Password"
          description={resetTarget ? `Assign a new password for ${resetTarget.displayName}.` : ""}
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setResetTarget(null)} disabled={Boolean(actionLoadingId)}>
                Cancel
              </Button>
              <Button onClick={() => void handleResetPassword()} disabled={!resetPassword.trim() || Boolean(actionLoadingId)}>
                {actionLoadingId === resetTarget?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Password
              </Button>
            </>
          }
        >
          <div className="grid gap-2">
            <Label htmlFor="reset-password">New Password</Label>
            <Input
              id="reset-password"
              type="password"
              value={resetPassword}
              onChange={event => setResetPassword(event.target.value)}
            />
          </div>
        </Modal>

        <ConfirmDialog
          open={Boolean(confirmAction)}
          onOpenChange={open => {
            if (!open) {
              setConfirmAction(null)
            }
          }}
          title={confirmAction?.type === "deactivate" ? "Deactivate user?" : "Reactivate user?"}
          description={
            confirmAction
              ? confirmAction.type === "deactivate"
                ? `${confirmAction.record.displayName} will lose access on the next request.`
                : `${confirmAction.record.displayName} will be able to sign in again.`
              : ""
          }
          confirmLabel={confirmAction?.type === "deactivate" ? "Deactivate" : "Reactivate"}
          variant={confirmAction?.type === "deactivate" ? "destructive" : "default"}
          isLoading={actionLoadingId === confirmAction?.record.id}
          onConfirm={() => {
            if (confirmAction) {
              void handleStatusChange(
                confirmAction.record,
                confirmAction.type === "deactivate" ? "inactive" : "active"
              )
            }
          }}
        />
      </div>
    </AppShell>
  )
}
