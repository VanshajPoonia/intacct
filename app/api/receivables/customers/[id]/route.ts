import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getSupabaseReceivablesCustomerById } from "@/lib/supabase/receivables"

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
    const customer = await getSupabaseReceivablesCustomerById(id)

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load customer from Supabase.",
      },
      { status: 500 }
    )
  }
}
