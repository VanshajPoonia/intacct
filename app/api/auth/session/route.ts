import { NextResponse } from "next/server"
import { getOptionalAuthenticatedAppUser, getUserPreferences } from "@/lib/supabase/app-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getOptionalAuthenticatedAppUser()

  if (!user) {
    return NextResponse.json({ user: null, preferences: null })
  }

  const preferences = await getUserPreferences(user.id, user.primaryEntityId)
  return NextResponse.json({ user, preferences })
}
