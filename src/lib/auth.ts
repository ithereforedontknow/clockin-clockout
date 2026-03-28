import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "./supabase"

/**
 * Returns the current Supabase session and a loading flag.
 * Subscribes to onAuthStateChange so the whole app reacts
 * immediately when the user signs in or out.
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

    // 2. Keep in sync with any auth event (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, isLoading }
}
