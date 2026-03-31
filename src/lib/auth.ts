import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "./supabase"

/**
 * Returns the current Supabase session and a loading flag.
 *
 * NOTE: Employee record linking (user_id = null → user_id = auth.uid())
 * is handled directly inside useCurrentEmployee() in queries.ts.
 * It does the email lookup + patch in a single query chain, which avoids
 * the race condition of doing it here in the background.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, isLoading }
}
