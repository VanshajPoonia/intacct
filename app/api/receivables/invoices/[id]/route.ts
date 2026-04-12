import { NextRequest, NextResponse } from "next/server"
import type { FinanceFilters } from "@/lib/types"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getSupabaseInvoiceDetailRouteData, sendSupabaseInvoice, voidSupabaseInvoice } from "@/lib/supabase/receivables"

export const dynamic = "force-dynamic"

function parseFilters(request: NextRequest): FinanceFilters | undefined {
  const entityId = request.nextUrl.searchParams.get("entityId") ?? undefined
  const dateStart = request.nextUrl.searchParams.get("dateStart")
  const dateEnd = request.nextUrl.searchParams.get("dateEnd")
  const preset = request.nextUrl.searchParams.get("datePreset") ?? undefined

  if (!dateStart || !dateEnd) {
    return entityId
      ? {
          entityId,
          dateRange: {
            startDate: new Date("2000-01-01T00:00:00.000Z"),
            endDate: new Date("2100-01-01T00:00:00.000Z"),
          },
        }
      : undefined
  }

  return {
    entityId,
    dateRange: {
      startDate: new Date(dateStart),
      endDate: new Date(dateEnd),
      preset: preset as FinanceFilters["dateRange"]["preset"],
    },
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 })
  }

  try {
    const { id } = await context.params
    const result = await getSupabaseInvoiceDetailRouteData(id, parseFilters(request))

    if (!result) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load invoice detail from Supabase.",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 })
  }

  try {
    const { id } = await context.params
    const body = (await request.json()) as { action?: "send" | "void" }

    const invoice =
      body.action === "send"
        ? await sendSupabaseInvoice(id)
        : body.action === "void"
          ? await voidSupabaseInvoice(id)
          : null

    if (!invoice) {
      return NextResponse.json({ error: "Invoice action could not be applied." }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update invoice in Supabase.",
      },
      { status: 500 }
    )
  }
}
