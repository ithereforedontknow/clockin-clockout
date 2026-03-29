import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "./supabase"

/**
 * Returns the current Supabase session and a loading flag.
 * Subscribes to onAuthStateChange so the whole app reacts
 * immediately when the user signs in or out.
 *
 * On first sign-in (SIGNED_IN event), we check if there's an
 * employee row whose email matches but has no user_id yet —
 * this is the "admin pre-created the record" flow. If found,
 * we link the new auth user to that employee row.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // ONLY use onAuthStateChange; it handles the initial load automatically
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setIsLoading(false)

      // Handle the linking logic
      if (event === "SIGNED_IN" && newSession?.user) {
        // Use a separate async block to avoid blocking the auth state transition
        linkEmployeeRecord(
          newSession.user.id,
          newSession.user.email ?? ""
        ).catch(console.error)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, isLoading }
}

/**
 * If an employee row exists with this email but no user_id,
 * patch it with the new auth user id. Silent no-op otherwise.
 */
async function linkEmployeeRecord(userId: string, email: string) {
  if (!email) return

  // Check if already linked (fast path — avoids unnecessary writes)
  const { data: existing } = await supabase
    .from("employees")
    .select("id, user_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (existing) return // already linked, nothing to do

  // Find an unlinked employee row with this email
  const { data: unlinked } = await supabase
    .from("employees")
    .select("id")
    .eq("email", email)
    .is("user_id", null)
    .maybeSingle()

  if (!unlinked) return // no pre-created record found

  // Link it
  await supabase
    .from("employees")
    .update({ user_id: userId })
    .eq("id", unlinked.id)
}
