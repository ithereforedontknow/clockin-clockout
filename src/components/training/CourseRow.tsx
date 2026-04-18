import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { GraduationCap, Pencil, Copy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCurriculumTags, useDuplicateCurriculum } from "@/lib/queries"
import type { Curriculum } from "@/lib/supabase"
export function CourseRow({
  course,
  categories,
}: {
  course: Curriculum
  categories: any[]
}) {
  const navigate = useNavigate()
  const { data: tags = [] } = useCurriculumTags(course.id)
  const category = categories.find((c) => c.id === course.category_id)
  const duplicateCourse = useDuplicateCurriculum()
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30">
      {course.thumbnail_url ? (
        <img
          src={course.thumbnail_url}
          alt=""
          className="h-14 w-20 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/5">
          <GraduationCap className="h-6 w-6 text-primary/20" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{course.title}</p>
          <Badge
            variant={course.is_published ? "default" : "secondary"}
            className="shrink-0 text-[10px]"
          >
            {course.is_published ? "Published" : "Draft"}
          </Badge>
        </div>
        {course.description && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {course.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {category && (
            <Badge variant="outline" className="text-[10px]">
              {category.name}
            </Badge>
          )}
          {tags.slice(0, 3).map((t: any) => (
            <Badge key={t.tag_id} variant="secondary" className="text-[10px]">
              {t.course_tags?.name}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="secondary" className="text-[10px]">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Created {format(new Date(course.created_at), "MMM d, yyyy")}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
      >
        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => duplicateCourse.mutate(course.id)}
        disabled={duplicateCourse.isPending}
      >
        <Copy className="mr-1 h-3 w-3" />
        Duplicate
      </Button>
    </div>
  )
}
