import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getImpersonationCookieName } from "@/lib/supabase/app-auth"

export const dynamic = "force-dynamic"

export async function POST() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  const response = NextResponse.json({ success: true })
  response.cookies.set(getImpersonationCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  })

  return response
}
