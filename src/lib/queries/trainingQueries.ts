import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import type {
  TrainingRecord,
  Curriculum,
  Certification,
  TrainingStatus,
} from "@/lib/supabase"
import { getCurrentEmployeeId } from "@/lib/queries/adminQueries"
import { writeAuditLog } from "@/lib/queries/auditQueries"
// ─── Queries ──────────────────────────────────────────────────────────────

export function useMyTrainingRecord() {
  return useQuery({
    queryKey: keys.trainingRecord(),
    queryFn: async (): Promise<TrainingRecord[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []

      const { data: emp, error: empError } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (empError || !emp) return []

      const { data: assignments, error: assignError } = await supabase
        .from("training_assignments")
        .select(
          `
          curriculum_id,
          due_date,
          assigned_at,
          curriculum:curriculums!inner(
            title,
            thumbnail_url,
            category_id,
            category:course_categories(name)
          )
        `
        )
        .eq("employee_id", emp.id)

      if (assignError) throw assignError
      if (!assignments?.length) return []

      const curriculumIds = assignments.map((a) => a.curriculum_id)

      const { data: certs, error: certError } = await supabase
        .from("certifications")
        .select("curriculum_id, issued_at")
        .eq("employee_id", emp.id)
        .in("curriculum_id", curriculumIds)

      if (certError) throw certError

      const completedMap = new Map(
        (certs || []).map((c) => [c.curriculum_id, c.issued_at])
      )
      const today = new Date()

      return assignments.map((row: any): TrainingRecord => {
        const completedAt = completedMap.get(row.curriculum_id) || null
        const dueDate = new Date(row.due_date)
        const daysRemaining = completedAt
          ? 0
          : Math.max(
              0,
              Math.ceil(
                (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              )
            )

        let status: TrainingStatus
        if (completedAt) status = "completed"
        else if (dueDate < today) status = "overdue"
        else if (daysRemaining <= 3) status = "due_soon"
        else status = "pending"

        return {
          curriculum_id: row.curriculum_id,
          curriculum_title: row.curriculum?.title ?? "Untitled Course",
          thumbnail_url: row.curriculum?.thumbnail_url ?? null,
          category_id: row.curriculum?.category_id ?? undefined,
          category_name: row.curriculum?.category?.name ?? undefined,
          assigned_at: row.assigned_at,
          due_date: row.due_date,
          completed_at: completedAt,
          employee_id: emp.id,
          days_remaining: daysRemaining,
          status,
        }
      })
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useCurriculums() {
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

export function useAllCurriculums() {
  return useCurriculums()
}

export function useCurriculumDetail(id: string) {
  return useQuery({
    queryKey: keys.curriculum(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculums")
        .select("*, modules:modules(*, lessons:lessons(*))")
        .eq("id", id)
        .single()
      if (error) throw error
      if (data?.modules) {
        data.modules.sort((a: any, b: any) => a.order_index - b.order_index)
        data.modules.forEach((m: any) => {
          m.lessons?.sort((a: any, b: any) => a.order_index - b.order_index)
        })
      }
      return data
    },
    enabled: !!id,
  })
}

export function useCourseProgress(curriculumId: string) {
  return useQuery({
    queryKey: keys.courseProgress(curriculumId),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: empData } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (!empData)
        return { totalLessons: 0, completedLessons: 0, percentage: 0 }

      const { data, error } = await supabase
        .from("lessons")
        .select(`id, progress_records(is_completed, percent_watched)`)
        .eq("curriculum_id", curriculumId)
        .eq("progress_records.employee_id", empData.id)

      if (error) throw error

      const totalLessons = data?.length || 0
      const completedLessons =
        data?.filter((l) => l.progress_records?.[0]?.is_completed === true)
          .length || 0

      return {
        totalLessons,
        completedLessons,
        percentage: totalLessons
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
      }
    },
    enabled: !!curriculumId,
  })
}

export function useLessonCompletionMap(curriculumId: string) {
  return useQuery({
    queryKey: keys.lessonCompletionMap(curriculumId),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return new Set<string>()

      const { data: empData } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (!empData) return new Set<string>()

      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .eq("curriculum_id", curriculumId)

      const lessonIds = (lessons ?? []).map((l) => l.id)
      if (!lessonIds.length) return new Set<string>()

      const { data: progress } = await supabase
        .from("progress_records")
        .select("lesson_id")
        .eq("employee_id", empData.id)
        .eq("is_completed", true)
        .in("lesson_id", lessonIds)

      return new Set((progress ?? []).map((r) => r.lesson_id))
    },
    enabled: !!curriculumId,
  })
}

export function useMyCertifications() {
  return useQuery({
    queryKey: keys.certifications(),
    queryFn: async (): Promise<
      (Certification & { curriculum: Curriculum })[]
    > => {
      const { data, error } = await supabase
        .from("certifications")
        .select("*, curriculum:curriculums(*)")
        .order("issued_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCourseCategories() {
  return useQuery({
    queryKey: keys.courseCategories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_categories")
        .select("*")
        .order("name")
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCourseTags() {
  return useQuery({
    queryKey: keys.courseTags(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_tags")
        .select("*")
        .order("name")
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCurriculumTags(curriculumId: string) {
  return useQuery({
    queryKey: keys.curriculumTags(curriculumId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_tags")
        .select("tag_id, course_tags(name)")
        .eq("curriculum_id", curriculumId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!curriculumId,
  })
}

export function useAllTrainingRecordsPaginated(
  page: number = 1,
  pageSize: number = 50
) {
  return useQuery({
    queryKey: [...keys.allTrainingRecords(), { page, pageSize }],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await supabase
        .from("training_assignments")
        .select(
          `
          *,
          employee:employees(id, first_name, last_name, avatar_url, department),
          curriculum:curriculums(title, thumbnail_url, category_id, category:course_categories(name))
        `,
          { count: "exact" }
        )
        .order("due_date")
        .range(from, to)

      if (error) throw error
      return { data: data ?? [], total: count ?? 0 }
    },
  })
}
export function useAllTrainingRecords() {
  return useQuery({
    queryKey: keys.allTrainingRecords(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_assignments")
        .select(
          `
          *,
          employee:employees(id, first_name, last_name, avatar_url, department),
          curriculum:curriculums(title, thumbnail_url, category_id, category:course_categories(name))
        `
        )
        .order("due_date")
      if (error) throw error
      return data ?? []
    },
  })
}
// ─── Mutations ─────────────────────────────────────────────────────────────
export function useCreateCurriculum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      title: string
      description: string | null
      is_published: boolean
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (!emp) throw new Error("Employee record not found")

      const { data, error } = await supabase
        .from("curriculums")
        .insert({ ...payload, created_by: emp.id })
        .select()
        .single()
      if (error) throw error

      // Audit log
      await writeAuditLog({
        actor_id: emp.id,
        action: "create_curriculum",
        target_table: "curriculums",
        target_id: data.id,
        new_value: { title: payload.title, is_published: payload.is_published },
      })

      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.curriculums() }),
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
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: keys.curriculums() })
      qc.invalidateQueries({ queryKey: keys.curriculum(id) })
    },
  })
}
export function useDeleteCurriculum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const actorId = await getCurrentEmployeeId()

      // Get course title before deletion for audit
      const { data: course } = await supabase
        .from("curriculums")
        .select("title")
        .eq("id", id)
        .single()

      const { error } = await supabase.from("curriculums").delete().eq("id", id)
      if (error) throw error

      if (actorId) {
        await writeAuditLog({
          actor_id: actorId,
          action: "delete_curriculum",
          target_table: "curriculums",
          target_id: id,
          old_value: { title: course?.title },
        })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.curriculums() }),
  })
}

export function useDuplicateCurriculum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (curriculumId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (!emp) throw new Error("Employee record not found")

      const { data: original } = await supabase
        .from("curriculums")
        .select("*, modules:modules(*, lessons:lessons(*))")
        .eq("id", curriculumId)
        .single()

      const { data: newCourse } = await supabase
        .from("curriculums")
        .insert({
          title: `${original.title} (Copy)`,
          description: original.description,
          thumbnail_url: original.thumbnail_url,
          category_id: original.category_id,
          is_published: false,
          created_by: emp.id,
        })
        .select()
        .single()

      for (const mod of original.modules || []) {
        const { data: newMod } = await supabase
          .from("modules")
          .insert({
            curriculum_id: newCourse.id,
            title: mod.title,
            description: mod.description,
            order_index: mod.order_index,
          })
          .select()
          .single()

        for (const lesson of mod.lessons || []) {
          await supabase.from("lessons").insert({
            module_id: newMod.id,
            curriculum_id: newCourse.id,
            title: lesson.title,
            description: lesson.description,
            content_html: lesson.content_html,
            cf_stream_id: lesson.cf_stream_id,
            order_index: lesson.order_index,
            quiz: lesson.quiz,
          })
        }
      }
      return newCourse
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.curriculums() })
      toast.success("Course duplicated")
    },
  })
}
export function useAssignCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      employee_id: string
      curriculum_id: string
      due_date: string
    }) => {
      const actorId = await getCurrentEmployeeId()

      const { error } = await supabase
        .from("training_assignments")
        .upsert(
          { ...input, assigned_at: new Date().toISOString() },
          { onConflict: "employee_id,curriculum_id" }
        )
      if (error) throw error

      if (actorId) {
        await writeAuditLog({
          actor_id: actorId,
          action: "assign_course",
          target_table: "training_assignments",
          target_id: `${input.employee_id}:${input.curriculum_id}`,
          new_value: { due_date: input.due_date },
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.allTrainingRecords() })
      qc.invalidateQueries({ queryKey: keys.trainingRecord() })
    },
  })
}
export function useBulkUnassign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      employeeIds,
      curriculumId,
    }: {
      employeeIds: string[]
      curriculumId?: string
    }) => {
      const actorId = await getCurrentEmployeeId()

      let query = supabase
        .from("training_assignments")
        .delete()
        .in("employee_id", employeeIds)
      if (curriculumId) query = query.eq("curriculum_id", curriculumId)
      const { error } = await query
      if (error) throw error

      if (actorId) {
        await writeAuditLog({
          actor_id: actorId,
          action: "bulk_unassign_courses",
          target_table: "training_assignments",
          target_id: employeeIds.join(","),
          note: curriculumId ? `Course: ${curriculumId}` : "All courses",
        })
      }
    },
    onSuccess: (_, { employeeIds }) => {
      qc.invalidateQueries({ queryKey: keys.allTrainingRecords() })
      qc.invalidateQueries({ queryKey: keys.trainingRecord() })
      toast.success(`Unassigned from ${employeeIds.length} employee(s)`)
    },
  })
}

export function useUpdateCurriculumCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      categoryId,
    }: {
      id: string
      categoryId: string | null
    }) => {
      const { error } = await supabase
        .from("curriculums")
        .update({ category_id: categoryId })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.curriculums() }),
  })
}

export function useSetCurriculumTags() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      curriculumId,
      tagIds,
    }: {
      curriculumId: string
      tagIds: string[]
    }) => {
      await supabase
        .from("curriculum_tags")
        .delete()
        .eq("curriculum_id", curriculumId)
      if (tagIds.length > 0) {
        await supabase.from("curriculum_tags").insert(
          tagIds.map((tagId) => ({
            curriculum_id: curriculumId,
            tag_id: tagId,
          }))
        )
      }
    },
    onSuccess: (_, { curriculumId }) => {
      qc.invalidateQueries({ queryKey: keys.curriculumTags(curriculumId) })
      qc.invalidateQueries({ queryKey: keys.curriculums() })
    },
  })
}

export function useMarkLessonComplete() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      employee_id,
      lesson_id,
    }: {
      employee_id: string
      lesson_id: string
    }) => {
      await supabase.from("progress_records").upsert(
        {
          employee_id,
          lesson_id,
          percent_watched: 100,
          is_completed: true,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: "employee_id,lesson_id" }
      )

      const { data: lessonData } = await supabase
        .from("lessons")
        .select("curriculum_id")
        .eq("id", lesson_id)
        .single()

      if (lessonData?.curriculum_id) {
        const { data: allLessons } = await supabase
          .from("lessons")
          .select("id")
          .eq("curriculum_id", lessonData.curriculum_id)

        const { data: completedRecords } = await supabase
          .from("progress_records")
          .select("lesson_id")
          .eq("employee_id", employee_id)
          .eq("is_completed", true)
          .in(
            "lesson_id",
            (allLessons ?? []).map((l) => l.id)
          )

        // Add audit log when certification is issued
        if (
          allLessons &&
          completedRecords &&
          completedRecords.length >= allLessons.length
        ) {
          await supabase
            .from("certifications")
            .upsert(
              { employee_id, curriculum_id: lessonData.curriculum_id },
              { onConflict: "employee_id,curriculum_id" }
            )

          // Audit log for certification
          await writeAuditLog({
            actor_id: employee_id, // The employee themselves
            action: "complete_course",
            target_table: "certifications",
            target_id: `${employee_id}:${lessonData.curriculum_id}`,
            note: "Course completed, certificate issued",
          })
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-progress"] })
      qc.invalidateQueries({ queryKey: ["lesson-completion-map"] })
      qc.invalidateQueries({ queryKey: keys.trainingRecord() })
      qc.invalidateQueries({ queryKey: keys.certifications() })
    },
  })
}

export function useCreateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      curriculum_id: string
      title: string
      description: string | null
      order_index: number
    }) => {
      const { data, error } = await supabase
        .from("modules")
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { curriculum_id }) =>
      qc.invalidateQueries({ queryKey: keys.curriculum(curriculum_id) }),
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
      updates: {
        title?: string
        description?: string | null
        order_index?: number
      }
    }) => {
      const { error } = await supabase
        .from("modules")
        .update(updates)
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.curriculums() })
      qc.invalidateQueries({ queryKey: ["curriculum"] })
    },
  })
}

export function useDeleteModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("modules").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.curriculums() })
      qc.invalidateQueries({ queryKey: ["curriculum"] })
    },
  })
}

export function useCreateLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from("lessons")
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { curriculum_id }) =>
      qc.invalidateQueries({ queryKey: keys.curriculum(curriculum_id) }),
  })
}

export function useUpdateLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("lessons")
        .update(updates)
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.curriculums() })
      qc.invalidateQueries({ queryKey: ["curriculum"] })
    },
  })
}

export function useDeleteLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.curriculums() })
      qc.invalidateQueries({ queryKey: ["curriculum"] })
    },
  })
}

export function useUpdateLessonProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      employee_id: string
      lesson_id: string
      percent_watched: number
      is_completed: boolean
    }) => {
      const { error } = await supabase
        .from("progress_records")
        .upsert(
          { ...input, last_watched_at: new Date().toISOString() },
          { onConflict: "employee_id,lesson_id" }
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["course-progress"] }),
  })
}
export function useAllTrainingRecordsInfinite(pageSize: number = 50) {
  return useInfiniteQuery({
    queryKey: [...keys.allTrainingRecords(), "infinite"],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await supabase
        .from("training_assignments")
        .select(
          `
          *,
          employee:employees(id, first_name, last_name, avatar_url, department),
          curriculum:curriculums(title, thumbnail_url, category_id, category:course_categories(name))
        `,
          { count: "exact" }
        )
        .order("due_date")
        .range(from, to)

      if (error) throw error
      return {
        data: data ?? [],
        total: count ?? 0,
        nextPage: from + pageSize < (count ?? 0) ? pageParam + 1 : undefined,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })
}

export function useUnassignCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      employeeId,
      curriculumId,
    }: {
      employeeId: string
      curriculumId: string
    }) => {
      const { error } = await supabase
        .from("training_assignments")
        .delete()
        .eq("employee_id", employeeId)
        .eq("curriculum_id", curriculumId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.allTrainingRecords() })
      qc.invalidateQueries({ queryKey: keys.trainingRecord() })
      toast.success("Course unassigned")
    },
    onError: (e: any) => toast.error(e.message),
  })
}
