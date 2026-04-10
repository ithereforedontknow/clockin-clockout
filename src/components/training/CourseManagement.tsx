import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useCurriculumDetail,
  useUpdateCurriculum,
  useDeleteCurriculum,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from "@/lib/queries"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

export function CourseManagement() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: course, isLoading, refetch } = useCurriculumDetail(courseId!)
  const updateCurriculum = useUpdateCurriculum()
  const deleteCurriculum = useDeleteCurriculum()
  const createModule = useCreateModule()
  const updateModule = useUpdateModule()
  const deleteModule = useDeleteModule()
  const deleteLesson = useDeleteLesson()

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [isAddingModule, setIsAddingModule] = useState(false)

  if (isLoading) return <div className="p-8 text-center">Loading course...</div>
  if (!course) return <div className="p-8 text-center">Course not found</div>

  const modules = course.modules || []
  const selectedLesson = modules
    .flatMap((m: any) => m.lessons || [])
    .find((l: any) => l.id === selectedLessonId)

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) {
      toast.error("Module title required")
      return
    }
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

  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar */}
      <div className="w-80 overflow-y-auto border-r bg-muted/20 p-4">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/training")}
            className="flex items-center gap-1 text-sm"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
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
                <AddLessonForm
                  moduleId={module.id}
                  curriculumId={course.id}
                  onCreated={() => refetch()}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <Input
              defaultValue={course.title}
              className="border-0 px-0 text-3xl font-bold"
              onBlur={(e) =>
                updateCurriculum.mutate({
                  id: course.id,
                  updates: { title: e.target.value },
                })
              }
            />
            <Textarea
              defaultValue={course.description || ""}
              placeholder="Course description..."
              className="mt-2 resize-none border-0 px-0"
              onBlur={(e) =>
                updateCurriculum.mutate({
                  id: course.id,
                  updates: { description: e.target.value || null },
                })
              }
            />
          </div>

          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="mt-4">
              {selectedLesson ? (
                <LessonEditor
                  lesson={selectedLesson}
                  onUpdate={() => refetch()}
                />
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  Select a lesson from the sidebar to edit its content.
                </div>
              )}
            </TabsContent>
            <TabsContent value="settings">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="w-32 font-medium">Thumbnail URL</label>
                  <Input
                    placeholder="https://..."
                    defaultValue={course.thumbnail_url || ""}
                    onBlur={(e) =>
                      updateCurriculum.mutate({
                        id: course.id,
                        updates: { thumbnail_url: e.target.value || null },
                      })
                    }
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 font-medium">Published</label>
                  <input
                    type="checkbox"
                    checked={course.is_published}
                    onChange={(e) =>
                      updateCurriculum.mutate({
                        id: course.id,
                        updates: { is_published: e.target.checked },
                      })
                    }
                  />
                </div>
                <Button variant="destructive" onClick={handleDeleteCourse}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Course
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Helper component for adding a lesson
function AddLessonForm({
  moduleId,
  curriculumId,
  onCreated,
}: {
  moduleId: string
  curriculumId: string
  onCreated: () => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState("")
  const createLesson = useCreateLesson()

  const handleAdd = async () => {
    if (!title.trim()) {
      toast.error("Lesson title required")
      return
    }
    await createLesson.mutateAsync({
      module_id: moduleId,
      curriculum_id: curriculumId,
      title: title.trim(),
      description: null,
      order_index: 0,
    })
    setTitle("")
    setIsAdding(false)
    onCreated()
    toast.success("Lesson added")
  }

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-xs"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="mr-1 h-3 w-3" /> Add Lesson
      </Button>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      <Input
        placeholder="Lesson title"
        className="h-8"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAdd} disabled={createLesson.isPending}>
          {createLesson.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Add"
          )}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function LessonEditor({
  lesson,
  onUpdate,
}: {
  lesson: any
  onUpdate: () => void
}) {
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
              updates: { description: e.target.value || null },
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
              updates: { cf_stream_id: e.target.value || null },
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
    </div>
  )
}
