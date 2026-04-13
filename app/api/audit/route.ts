import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { AuditLogEntry, PaginatedResponse } from "@/lib/types"
import { requireAuthenticatedAppUser } from "@/lib/supabase/app-auth"
import { getSupabaseSecretKey, getSupabaseUrl } from "@/lib/supabase/env"

export const dynamic = "force-dynamic"

type AuditLogRow = {
  id: string
  organization_id: string | null
  actor_profile_id: string | null
  target_profile_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  entity_number: string | null
  details: Record<string, unknown> | null
  created_at: string
}

type ProfileRow = {
  id: string
  display_name: string | null
  first_name: string
  last_name: string
  email: string
}

function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function getProfileDisplayName(profile?: ProfileRow | null) {
  if (!profile) {
    return "System"
  }

  return profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || profile.email
}

function mapAuditLog(row: AuditLogRow, actor?: ProfileRow | null): AuditLogEntry {
  const changes = Array.isArray(row.details?.changes)
    ? row.details.changes
        .filter((change): change is { field: string; oldValue?: string; newValue?: string } => Boolean(change && typeof change === "object" && "field" in change))
        .map(change => ({
          field: String(change.field),
          oldValue: typeof change.oldValue === "string" ? change.oldValue : undefined,
          newValue: typeof change.newValue === "string" ? change.newValue : undefined,
        }))
    : undefined

  return {
    id: row.id,
    timestamp: new Date(row.created_at),
    action: row.action,
    entityType: row.entity_type ?? undefined,
    entityId: row.entity_id ?? undefined,
    entityNumber: row.entity_number ?? (typeof row.details?.entityNumber === "string" ? row.details.entityNumber : undefined),
    userId: row.actor_profile_id ?? undefined,
    userName: getProfileDisplayName(actor),
    changes,
    ipAddress: typeof row.details?.ipAddress === "string" ? row.details.ipAddress : undefined,
    details: row.details ?? undefined,
  }
}

export async function GET(request: NextRequest) {
  const user = await requireAuthenticatedAppUser()
  const admin = createAdminClient()
  const entityType = request.nextUrl.searchParams.get("entityType")
  const entityId = request.nextUrl.searchParams.get("entityId")
  const startDate = request.nextUrl.searchParams.get("startDate")
  const endDate = request.nextUrl.searchParams.get("endDate")
  const rawPage = Number(request.nextUrl.searchParams.get("page") ?? "1")
  const rawPageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "20")
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const pageSize = Number.isFinite(rawPageSize) && rawPageSize > 0 ? rawPageSize : 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from("audit_logs")
    .select("id, organization_id, actor_profile_id, target_profile_id, action, entity_type, entity_id, entity_number, details, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (!user.isGlobalAdmin) {
    query = query.eq("organization_id", user.organizationId)
  }

  if (entityType) {
    query = query.eq("entity_type", entityType)
  }

  if (entityId) {
    query = query.eq("entity_id", entityId)
  }

  if (startDate) {
    query = query.gte("created_at", new Date(startDate).toISOString())
  }

  if (endDate) {
    query = query.lte("created_at", new Date(endDate).toISOString())
  }

  const { data, error, count } = await query.returns<AuditLogRow[]>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data ?? []
  const actorIds = [...new Set(rows.map(row => row.actor_profile_id).filter((value): value is string => Boolean(value)))]
  const profileMap = new Map<string, ProfileRow>()

  if (actorIds.length) {
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, display_name, first_name, last_name, email")
      .in("id", actorIds)
      .returns<ProfileRow[]>()

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    ;(profiles ?? []).forEach(profile => profileMap.set(profile.id, profile))
  }

  const total = count ?? rows.length
  const response: PaginatedResponse<AuditLogEntry> = {
    data: rows.map(row => mapAuditLog(row, row.actor_profile_id ? profileMap.get(row.actor_profile_id) : null)),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  }

  return NextResponse.json(response)
}
