import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Trash2, Eye, EyeOff, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  useCurriculumDetail,
  useUpdateCurriculum,
  useDeleteCurriculum,
  useCreateModule,
  useDeleteModule,
  useUpdateLesson,
  useUpdateModule, // keep
  useCreateLesson, // keep
  useDeleteLesson, // keep
} from "@/lib/queries"

export function CourseEditor() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { data: course, isLoading, refetch } = useCurriculumDetail(courseId!)
  const updateCurriculum = useUpdateCurriculum()
  const deleteCurriculum = useDeleteCurriculum()
  const createModule = useCreateModule()
  const deleteModule = useDeleteModule()
  const createLesson = useCreateLesson()
  const updateModule = useUpdateModule()
  const deleteLesson = useDeleteLesson()

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [newLessonTitle, setNewLessonTitle] = useState("")
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [isAddingLesson, setIsAddingLesson] = useState(false)

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading course...
      </div>
    )
  if (!course)
    return (
      <div className="flex h-screen items-center justify-center">
        Course not found
      </div>
    )

  const modules = course.modules || []
  const selectedLesson = selectedLessonId
    ? modules
        .flatMap((m: any) => m.lessons || [])
        .find((l: any) => l.id === selectedLessonId)
    : null

  const handleDeleteCourse = async () => {
    if (
      confirm(
        `Delete "${course.title}" and all its content? This cannot be undone.`
      )
    ) {
      await deleteCurriculum.mutateAsync(course.id)
      toast.success("Course deleted")
      navigate("/training")
    }
  }

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return
    await createModule.mutateAsync({
      curriculum_id: course.id,
      title: newModuleTitle.trim(),
      description: null,
      order_index: modules.length,
    })
    setNewModuleTitle("")
    setIsAddingModule(false)
    refetch()
    toast.success("Module added")
  }

  const handleAddLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return
    await createLesson.mutateAsync({
      module_id: moduleId,
      curriculum_id: course.id,
      title: newLessonTitle.trim(),
      description: null,
      order_index: 0,
    })
    setNewLessonTitle("")
    setIsAddingLesson(false)
    refetch()
    toast.success("Lesson added")
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top Bar */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/training")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <Input
                defaultValue={course.title}
                className="h-auto border-0 px-0 text-2xl font-bold"
                onBlur={(e) =>
                  updateCurriculum.mutate({
                    id: course.id,
                    updates: { title: e.target.value },
                  })
                }
              />
            </div>
            <Badge variant={course.is_published ? "default" : "secondary"}>
              {course.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                updateCurriculum.mutate({
                  id: course.id,
                  updates: { is_published: !course.is_published },
                })
              }
            >
              {course.is_published ? (
                <EyeOff className="mr-2 h-4 w-4" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {course.is_published ? "Unpublish" : "Publish"}
            </Button>
            <Button variant="destructive" onClick={handleDeleteCourse}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Modules & Lessons */}
        <div className="w-80 overflow-y-auto border-r bg-muted/20">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Course Content</h3>
              <Button size="sm" onClick={() => setIsAddingModule(true)}>
                <Plus className="mr-1 h-4 w-4" /> Module
              </Button>
            </div>

            {isAddingModule && (
              <div className="mb-4 space-y-2">
                <Input
                  placeholder="Module title"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddModule}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingModule(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {modules.map((module: any) => (
                <div
                  key={module.id}
                  className="rounded-lg border bg-background p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Input
                      defaultValue={module.title}
                      className="h-8 border-0 px-0 text-sm font-semibold"
                      onBlur={(e) =>
                        updateModule.mutate({
                          id: module.id,
                          updates: { title: e.target.value },
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteModule.mutate(module.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="ml-2 space-y-1">
                    {(module.lessons || []).map((lesson: any) => (
                      <div
                        key={lesson.id}
                        className={`flex cursor-pointer items-center justify-between rounded px-2 py-1 hover:bg-muted ${
                          selectedLessonId === lesson.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedLessonId(lesson.id)}
                      >
                        <span className="flex-1 truncate text-sm">
                          {lesson.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteLesson.mutate(lesson.id)
                          }}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    ))}

                    {isAddingLesson && (
                      <div className="mt-2 space-y-2">
                        <Input
                          placeholder="Lesson title"
                          className="h-8"
                          value={newLessonTitle}
                          onChange={(e) => setNewLessonTitle(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddLesson(module.id)
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddLesson(module.id)}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsAddingLesson(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isAddingLesson && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => setIsAddingLesson(true)}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add Lesson
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Lesson Editor */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl p-6">
            {selectedLesson ? (
              <LessonEditor lesson={selectedLesson} onUpdate={refetch} />
            ) : (
              <div className="flex h-96 items-center justify-center text-muted-foreground">
                Select a lesson from the sidebar to edit
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LessonEditor({ lesson }: { lesson: any; onUpdate: () => void }) {
  const updateLesson = useUpdateLesson()
  const [content, setContent] = useState(lesson.content_html || "")

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium">Lesson Title</label>
        <Input
          defaultValue={lesson.title}
          className="mt-1 text-xl"
          onBlur={(e) =>
            updateLesson.mutate({
              id: lesson.id,
              updates: { title: e.target.value },
            })
          }
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          defaultValue={lesson.description || ""}
          className="mt-1"
          placeholder="Brief description of this lesson"
          onBlur={(e) =>
            updateLesson.mutate({
              id: lesson.id,
              updates: { description: e.target.value },
            })
          }
        />
      </div>

      <div>
        <label className="text-sm font-medium">Cloudflare Stream ID</label>
        <Input
          defaultValue={lesson.cf_stream_id || ""}
          className="mt-1 font-mono text-sm"
          placeholder="video ID from Cloudflare"
          onBlur={(e) =>
            updateLesson.mutate({
              id: lesson.id,
              updates: { cf_stream_id: e.target.value },
            })
          }
        />
      </div>

      <div>
        <label className="text-sm font-medium">Lesson Content</label>
        <div className="mt-2 rounded-lg border">
          <RichTextEditor
            content={content}
            onChange={(html) => {
              setContent(html)
              updateLesson.mutate({
                id: lesson.id,
                updates: { content_html: html },
              })
            }}
          />
        </div>
      </div>

      {lesson.quiz && (
        <div>
          <label className="text-sm font-medium">Quiz (JSON)</label>
          <Textarea
            defaultValue={JSON.stringify(lesson.quiz, null, 2)}
            className="mt-1 font-mono text-sm"
            rows={10}
            onBlur={(e) => {
              try {
                const quiz = JSON.parse(e.target.value)
                updateLesson.mutate({ id: lesson.id, updates: { quiz } })
              } catch (err) {
                toast.error("Invalid JSON")
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
