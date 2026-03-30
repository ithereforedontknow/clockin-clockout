import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "./supabase"

/**
 * Returns the current Supabase session and a loading flag.
 * On SIGNED_IN, links the auth user to a pre-created employee
 * row if one exists with a matching email and no user_id yet.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 1. Hydrate from localStorage on first mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsLoading(false)
    })

    // 2. Keep in sync with auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setIsLoading(false)

      // 3. On first sign-in, attempt to link an unlinked employee row
      if (event === "SIGNED_IN" && session?.user) {
        await linkEmployeeRecord(
          session.user.id,
          // Email comes from the JWT — no auth.users query needed
          session.user.email ?? ""
        )
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, isLoading }
}

/**
 * Links a pre-created employee row (user_id IS NULL, email matches)
 * to the newly authenticated user. Safe to call on every sign-in —
 * it's a no-op if already linked.
 */
async function linkEmployeeRecord(userId: string, email: string) {
  if (!email) return

  // Normalise to lowercase — must match how admin stored the email
  const normalisedEmail = email.trim().toLowerCase()

  // Fast path — already linked, skip
  const { data: alreadyLinked } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (alreadyLinked) return

  // Find a pre-created row with this email and no user_id
  const { data: unlinked } = await supabase
    .from("employees")
    .select("id")
    .eq("email", normalisedEmail)
    .is("user_id", null)
    .maybeSingle()

  if (!unlinked) return

  // Patch user_id — allowed by the "link unlinked employee" RLS policy
  const { error } = await supabase
    .from("employees")
    .update({ user_id: userId })
    .eq("id", unlinked.id)
    .is("user_id", null) // extra safety — prevent race condition overwrite

  if (error) {
    console.error("Failed to link employee record:", error.message)
  }
}
