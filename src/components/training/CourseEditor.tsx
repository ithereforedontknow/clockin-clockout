import { useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  GripVertical,
  ImagePlus,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  useCurriculumDetail,
  useUpdateCurriculum,
  useDeleteCurriculum,
  useCreateModule,
  useDeleteModule,
  useUpdateLesson,
  useUpdateModule,
  useCreateLesson,
  useDeleteLesson,
} from "@/lib/queries"
import { QuizBuilder } from "@/components/training/QuizBuilder"
import { supabase } from "@/lib/supabase"
export function CourseEditor() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { data: course, isLoading } = useCurriculumDetail(courseId!)
  const updateCurriculum = useUpdateCurriculum()
  const deleteCurriculum = useDeleteCurriculum()
  const createModule = useCreateModule()
  const deleteModule = useDeleteModule()
  const createLesson = useCreateLesson()
  const updateModule = useUpdateModule()
  const deleteLesson = useDeleteLesson()

  const sensors = useSensors(useSensor(PointerSensor))

  const queryClient = useQueryClient()

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [addingLessonForModule, setAddingLessonForModule] = useState<
    string | null
  >(null)
  const [newLessonTitle, setNewLessonTitle] = useState("")

  const thumbInputRef = useRef<HTMLInputElement>(null)

  const [showDeleteCourseDialog, setShowDeleteCourseDialog] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState<{
    type: "module" | "lesson"
    id: string
    label: string
  } | null>(null)

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

  const handleDeleteCourse = () => setShowDeleteCourseDialog(true)

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
    queryClient.invalidateQueries({ queryKey: ["curriculum", course.id] })
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
    setAddingLessonForModule(null)
    queryClient.invalidateQueries({ queryKey: ["curriculum", course.id] })
    toast.success("Lesson added")
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = modules.findIndex((m: any) => m.id === active.id)
    const newIndex = modules.findIndex((m: any) => m.id === over.id)
    const reordered = arrayMove(modules, oldIndex, newIndex)
    // Optimistically update UI via refetch after saving
    await Promise.all(
      reordered.map((m: any, i: number) =>
        updateModule.mutateAsync({ id: m.id, updates: { order_index: i } })
      )
    )
    queryClient.invalidateQueries({ queryKey: ["curriculum", course.id] })
  }

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split(".").pop()
    const path = `thumbnails/${course.id}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("course-assets")
      .upload(path, file, { upsert: true })
    if (uploadError) {
      toast.error("Upload failed")
      return
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("course-assets").getPublicUrl(path)
    updateCurriculum.mutate({
      id: course.id,
      updates: { thumbnail_url: publicUrl },
    })
    toast.success("Thumbnail updated")
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top Bar */}
      <>
        <input
          ref={thumbInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleThumbnailUpload}
        />
        <Button
          variant="outline"
          onClick={() => thumbInputRef.current?.click()}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          {course.thumbnail_url ? "Change Thumbnail" : "Add Thumbnail"}
        </Button>
      </>
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={modules.map((m: any) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {modules.map((module: any) => (
                    <SortableModule key={module.id} module={module}>
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
                            onClick={() =>
                              setConfirmDelete({
                                type: "module",
                                id: module.id,
                                label: module.title,
                              })
                            }
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
                                  setConfirmDelete({
                                    type: "lesson",
                                    id: lesson.id,
                                    label: lesson.title,
                                  })
                                }}
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          ))}

                          {addingLessonForModule === module.id && (
                            <div className="mt-2 space-y-2">
                              <Input
                                placeholder="Lesson title"
                                className="h-8"
                                value={newLessonTitle}
                                onChange={(e) =>
                                  setNewLessonTitle(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  handleAddLesson(module.id)
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
                                  onClick={() => setAddingLessonForModule(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {addingLessonForModule !== module.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs"
                              onClick={() =>
                                setAddingLessonForModule(module.id)
                              }
                            >
                              <Plus className="mr-1 h-3 w-3" /> Add Lesson
                            </Button>
                          )}
                        </div>
                      </div>
                    </SortableModule>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>

        {/* Right Panel - Lesson Editor */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl p-6">
            <Tabs defaultValue={selectedLesson ? "lesson" : "details"}>
              <TabsList className="mb-6">
                <TabsTrigger value="details">Course Details</TabsTrigger>
                <TabsTrigger value="lesson" disabled={!selectedLesson}>
                  {selectedLesson ? "Edit Lesson" : "Select a Lesson"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <CourseDetailsEditor
                  course={course}
                  onUpdate={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["curriculum", course.id],
                    })
                  }
                />
              </TabsContent>

              <TabsContent value="lesson">
                {selectedLesson ? (
                  <LessonEditor
                    lesson={selectedLesson}
                    onUpdate={() =>
                      queryClient.invalidateQueries({
                        queryKey: ["curriculum", course.id],
                      })
                    }
                  />
                ) : (
                  <div className="flex h-96 items-center justify-center text-muted-foreground">
                    Select a lesson from the sidebar to edit
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {confirmDelete?.type} "{confirmDelete?.label}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.type === "module"
                ? "All lessons inside this module will also be deleted."
                : "This lesson will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                if (confirmDelete?.type === "module") {
                  await deleteModule.mutateAsync(confirmDelete.id)
                  toast.success("Module deleted")
                } else if (confirmDelete?.type === "lesson") {
                  await deleteLesson.mutateAsync(confirmDelete.id)
                  toast.success("Lesson deleted")
                }
                setConfirmDelete(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

      <QuizBuilder
        quiz={lesson.quiz}
        onSave={(quiz) =>
          updateLesson.mutate({ id: lesson.id, updates: { quiz } })
        }
      />
    </div>
  )
}
function CourseDetailsEditor({
  course,
  onUpdate,
}: {
  course: any
  onUpdate: () => void
}) {
  const updateCurriculum = useUpdateCurriculum()
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split(".").pop()
    const path = `thumbnails/${course.id}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("course-assets")
      .upload(path, file, { upsert: true })
    if (uploadError) {
      toast.error("Upload failed")
      return
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("course-assets").getPublicUrl(path)
    updateCurriculum.mutate(
      { id: course.id, updates: { thumbnail_url: publicUrl } },
      { onSuccess: onUpdate }
    )
    toast.success("Thumbnail updated")
  }

  return (
    <div className="space-y-6">
      {/* Thumbnail */}
      <div>
        <label className="text-sm font-medium">Course Thumbnail</label>
        <div className="mt-2 flex items-center gap-4">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt="Thumbnail"
              className="h-24 w-40 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed bg-muted text-xs text-muted-foreground">
              No thumbnail
            </div>
          )}
          <div className="space-y-2">
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => thumbInputRef.current?.click()}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              {course.thumbnail_url ? "Change Thumbnail" : "Upload Thumbnail"}
            </Button>
            {course.thumbnail_url && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() =>
                  updateCurriculum.mutate(
                    { id: course.id, updates: { thumbnail_url: null } },
                    { onSuccess: onUpdate }
                  )
                }
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          className="mt-1"
          defaultValue={course.description ?? ""}
          placeholder="What will students learn in this course?"
          rows={4}
          onBlur={(e) =>
            updateCurriculum.mutate(
              { id: course.id, updates: { description: e.target.value } },
              { onSuccess: onUpdate }
            )
          }
        />
      </div>
    </div>
  )
}
function SortableModule({
  module,
  children,
}: {
  module: any
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: module.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="rounded-lg border bg-background p-3"
    >
      <div className="mb-2 flex items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}
