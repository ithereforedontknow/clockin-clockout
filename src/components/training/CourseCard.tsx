import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Video,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  useCurriculumDetail,
  useCreateModule,
  useCreateLesson,
} from "@/lib/queries"
import type { Curriculum } from "@/lib/supabase"

interface CourseCardProps {
  course: Curriculum
  isExpanded: boolean
  onToggleExpand: () => void
}

export function CourseCard({
  course,
  isExpanded,
  onToggleExpand,
}: CourseCardProps) {
  const { data: detail } = useCurriculumDetail(isExpanded ? course.id : "")

  const createModule = useCreateModule()
  const createLesson = useCreateLesson()

  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [newLessonTitle, setNewLessonTitle] = useState("")
  const [newLessonDesc, setNewLessonDesc] = useState("")
  const [lessonContent, setLessonContent] = useState("")

  const modules = detail?.modules || []

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return toast.error("Module title required")
    await createModule.mutateAsync({
      curriculum_id: course.id,
      title: newModuleTitle.trim(),
      description: null,
      order_index: 0,
    })
    setNewModuleTitle("")
    toast.success("Module added")
  }

  const handleAddLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return toast.error("Lesson title required")
    await createLesson.mutateAsync({
      module_id: moduleId,
      curriculum_id: course.id,
      title: newLessonTitle.trim(),
      description: newLessonDesc.trim() || null,
      order_index: 0,
    })
    setNewLessonTitle("")
    setNewLessonDesc("")
    setLessonContent("")
    toast.success("Lesson created successfully")
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onToggleExpand}>
            {isExpanded ? <ChevronDown /> : <ChevronRight />}
          </Button>
          <div>
            <CardTitle>{course.title}</CardTitle>
            {course.description && (
              <p className="text-sm text-muted-foreground">
                {course.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Badge variant={course.is_published ? "default" : "secondary"}>
            {course.is_published ? "Published" : "Draft"}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toast.info("Publish toggle coming soon")}
          >
            {course.is_published ? <EyeOff /> : <Eye />}
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-8 p-6">
          {modules.map((module: any) => (
            <div key={module.id} className="rounded-xl border p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold">{module.title}</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddLesson(module.id)}
                >
                  + Add Lesson
                </Button>
              </div>

              <div className="mb-6 space-y-2">
                {(module.lessons || []).map((lesson: any) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3"
                  >
                    <Video className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{lesson.title}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <Label>New Lesson</Label>
                <Input
                  placeholder="Lesson title"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  className="mt-3"
                />
                <Textarea
                  placeholder="Short description"
                  value={newLessonDesc}
                  onChange={(e) => setNewLessonDesc(e.target.value)}
                  className="mt-3"
                />
                <div className="mt-4">
                  <Label>Content</Label>
                  <RichTextEditor
                    content={lessonContent}
                    onChange={setLessonContent}
                  />
                </div>
                <Button
                  className="mt-4"
                  onClick={() => handleAddLesson(module.id)}
                >
                  Create Lesson
                </Button>
              </div>
            </div>
          ))}

          <div className="flex gap-3 border-t pt-6">
            <Input
              placeholder="New module title"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
            />
            <Button onClick={handleAddModule}>Add Module</Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
