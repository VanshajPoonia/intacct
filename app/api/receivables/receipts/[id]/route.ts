import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getSupabaseReceiptById } from "@/lib/supabase/receivables"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 })
  }

  try {
    const { id } = await context.params
    const receipt = await getSupabaseReceiptById(id)

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 })
    }

    return NextResponse.json(receipt)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load receipt from Supabase.",
      },
      { status: 500 }
    )
  }
}
