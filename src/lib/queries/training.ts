import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import type {
  Curriculum,
  TrainingRecord,
  Certification,
  LmsRole,
} from "@/lib/supabase"

// Called internally from employees.ts on first sign-in
export async function seedLmsProfile(
  userId: string,
  fullName: string,
  avatarUrl: string | null,
  role: LmsRole
) {
  await supabase
    .from("lms_profiles")
    .upsert(
      { id: userId, full_name: fullName, avatar_url: avatarUrl, role },
      { onConflict: "id", ignoreDuplicates: true }
    )
}

export function useAllCurriculums() {
  return useQuery({
    queryKey: keys.curriculums(),
    queryFn: async (): Promise<Curriculum[]> => {
      const { data, error } = await supabase
        .from("curriculums")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCurriculumDetail(courseId: string) {
  return useQuery({
    queryKey: keys.curriculum(courseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculums")
        .select(
          `
          *,
          modules:lms_modules (
            *,
            lessons (*)
          )
        `
        )
        .eq("id", courseId)
        .single()
      if (error) throw error
      // Sort modules and their lessons by order_index
      if (data?.modules) {
        data.modules.sort((a: any, b: any) => a.order_index - b.order_index)
        data.modules.forEach((m: any) => {
          if (m.lessons)
            m.lessons.sort((a: any, b: any) => a.order_index - b.order_index)
        })
      }
      return data
    },
    enabled: !!courseId,
  })
}

export function useMyTrainingRecord() {
  return useQuery({
    queryKey: keys.myTraining(),
    queryFn: async (): Promise<TrainingRecord[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      const { data, error } = await supabase
        .from("training_records")
        .select("*")
        .eq("user_id", user.id)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useAllTrainingRecords() {
  return useQuery({
    queryKey: keys.allTraining(),
    queryFn: async (): Promise<TrainingRecord[]> => {
      const { data, error } = await supabase
        .from("training_records")
        .select("*")
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCourseProgress(curriculumId: string) {
  return useQuery({
    queryKey: keys.courseProgress(curriculumId),
    queryFn: async (): Promise<{
      percentage: number
      completedLessons: number
      totalLessons: number
    }> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { percentage: 0, completedLessons: 0, totalLessons: 0 }

      // Get all lesson IDs for this curriculum
      const { data: modules } = await supabase
        .from("lms_modules")
        .select("id")
        .eq("curriculum_id", curriculumId)

      if (!modules?.length)
        return { percentage: 0, completedLessons: 0, totalLessons: 0 }

      const moduleIds = modules.map((m) => m.id)
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .in("module_id", moduleIds)

      const totalLessons = lessons?.length ?? 0
      if (!totalLessons)
        return { percentage: 0, completedLessons: 0, totalLessons: 0 }

      const lessonIds = lessons!.map((l) => l.id)
      const { data: progress } = await supabase
        .from("progress_records")
        .select("lesson_id, is_completed")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds)
        .eq("is_completed", true)

      const completedLessons = progress?.length ?? 0
      const percentage = Math.round((completedLessons / totalLessons) * 100)
      return { percentage, completedLessons, totalLessons }
    },
    enabled: !!curriculumId,
  })
}

export function useMarkLessonComplete() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      user_id,
      lesson_id,
    }: {
      user_id: string
      lesson_id: string
    }) => {
      const { error } = await supabase.from("progress_records").upsert(
        {
          user_id,
          lesson_id,
          is_completed: true,
          percent_watched: 100,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      )
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-progress"] })
      qc.invalidateQueries({ queryKey: keys.myTraining() })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useUpdateLessonProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      user_id: string
      lesson_id: string
      percent_watched: number
      is_completed: boolean
    }) => {
      const { error } = await supabase
        .from("progress_records")
        .upsert(
          { ...input, last_watched_at: new Date().toISOString() },
          { onConflict: "user_id,lesson_id" }
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["course-progress"] }),
  })
}

export function useAssignCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      user_id: string
      curriculum_id: string
      due_date: string
    }) => {
      const { error } = await supabase
        .from("training_assignments")
        .upsert(
          { ...input, assigned_at: new Date().toISOString() },
          { onConflict: "user_id,curriculum_id" }
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.allTraining() }),
    onError: (e: any) => toast.error(e.message),
  })
}

export function useCreateCurriculum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { title: string; description?: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from("curriculums")
        .insert({ ...input, created_by: user!.id, is_published: false })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.curriculums() }),
    onError: (e: any) => toast.error(e.message),
  })
}

export function useUpdateCurriculum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Curriculum>
    }) => {
      const { data, error } = await supabase
        .from("curriculums")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: keys.curriculum(data.id) })
      qc.invalidateQueries({ queryKey: keys.curriculums() })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useDeleteCurriculum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("curriculums").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.curriculums() }),
    onError: (e: any) => toast.error(e.message),
  })
}

export function useCreateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      curriculum_id: string
      title: string
      description: string | null
      order_index: number
    }) => {
      const { data, error } = await supabase
        .from("lms_modules")
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: keys.curriculum(vars.curriculum_id) })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useUpdateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: { title?: string; order_index?: number }
    }) => {
      const { data, error } = await supabase
        .from("lms_modules")
        .update(updates)
        .eq("id", id)
        .select("*, curriculum_id")
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: keys.curriculum(data.curriculum_id) })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useDeleteModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: mod } = await supabase
        .from("lms_modules")
        .select("curriculum_id")
        .eq("id", id)
        .single()
      const { error } = await supabase.from("lms_modules").delete().eq("id", id)
      if (error) throw error
      return mod
    },
    onSuccess: (mod) => {
      if (mod?.curriculum_id)
        qc.invalidateQueries({ queryKey: keys.curriculum(mod.curriculum_id) })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useCreateLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      module_id: string
      curriculum_id: string
      title: string
      description: string | null
      order_index: number
    }) => {
      const { curriculum_id, ...insertData } = input
      const { data, error } = await supabase
        .from("lessons")
        .insert(insertData)
        .select()
        .single()
      if (error) throw error
      return { ...data, curriculum_id }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: keys.curriculum(data.curriculum_id) })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useUpdateLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<{
        title: string
        description: string | null
        cf_stream_id: string | null
        content_html: string | null
        quiz: any
        order_index: number
      }>
    }) => {
      const { data, error } = await supabase
        .from("lessons")
        .update(updates)
        .eq("id", id)
        .select("*, module:lms_modules(curriculum_id)")
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      const curriculumId = (data as any).module?.curriculum_id
      if (curriculumId)
        qc.invalidateQueries({ queryKey: keys.curriculum(curriculumId) })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useDeleteLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: lesson } = await supabase
        .from("lessons")
        .select("module_id, module:lms_modules(curriculum_id)")
        .eq("id", id)
        .single()
      const { error } = await supabase.from("lessons").delete().eq("id", id)
      if (error) throw error
      return lesson
    },
    onSuccess: (lesson: any) => {
      const curriculumId = lesson?.module?.curriculum_id
      if (curriculumId)
        qc.invalidateQueries({ queryKey: keys.curriculum(curriculumId) })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useMyCertifications() {
  return useQuery({
    queryKey: keys.certifications("me"),
    queryFn: async (): Promise<Certification[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .eq("user_id", user.id)
      if (error) throw error
      return data ?? []
    },
  })
}
