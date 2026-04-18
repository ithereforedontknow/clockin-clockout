import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import type { Announcement } from "@/lib/supabase"

export function useAnnouncements(employeeId: string, employerId?: string) {
  return useQuery({
    queryKey: keys.announcements(employeeId),
    queryFn: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase
        .from("announcements")
        .select(
          "*, author:employees!posted_by(first_name,last_name,avatar_url)"
        )
        .or(
          employerId
            ? `target.eq.all,and(target.eq.employer_team,target_employer_id.eq.${employerId})`
            : `target.eq.all`
        )
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20)
      if (error) throw error
      return data ?? []
    },
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      title: string
      body: string
      posted_by: string
      target: "all" | "employer_team"
      target_employer_id: string | null
    }) => {
      const { data, error } = await supabase
        .from("announcements")
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  })
}

export function usePinAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase
        .from("announcements")
        .update({ pinned })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  })
}
