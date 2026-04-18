import { useState, useRef, useEffect } from "react"
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
  BookOpen,
  Search,
  ChevronRight,
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
  useCourseCategories,
  useUpdateCurriculumCategory,
  useCurriculumTags,
  useSetCurriculumTags,
} from "@/lib/queries"
import { QuizBuilder } from "@/components/training/QuizBuilder"
import { TagSelector } from "@/components/training/TagSelector"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const [searchTerm, setSearchTerm] = useState("")

  const sensors = useSensors(useSensor(PointerSensor))
  const queryClient = useQueryClient()

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [addingLessonForModule, setAddingLessonForModule] = useState<
    string | null
  >(null)
  const [newLessonTitle, setNewLessonTitle] = useState("")
  const [showDeleteCourseDialog, setShowDeleteCourseDialog] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "module" | "lesson"
    id: string
    label: string
  } | null>(null)

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  if (!course)
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Course not found
      </div>
    )

  const modules = course.modules || []
  const selectedLesson = selectedLessonId
    ? modules
        .flatMap((m: any) => m.lessons || [])
        .find((l: any) => l.id === selectedLessonId)
    : null

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
    await Promise.all(
      reordered.map((m: any, i: number) =>
        updateModule.mutateAsync({ id: m.id, updates: { order_index: i } })
      )
    )
    queryClient.invalidateQueries({ queryKey: ["curriculum", course.id] })
  }

  const filteredModules = modules
    .map((module: any) => {
      const moduleMatches = module.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      const filteredLessons = (module.lessons || []).filter((lesson: any) =>
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (moduleMatches || filteredLessons.length > 0) {
        return {
          ...module,
          lessons: filteredLessons.length ? filteredLessons : module.lessons,
        }
      }
      return null
    })
    .filter(Boolean)

  const totalLessons = modules.reduce(
    (acc: number, m: any) => acc + (m.lessons?.length ?? 0),
    0
  )

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("/", { state: { tab: "training" } })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2.5">
            <Input
              defaultValue={course.title}
              className="h-8 border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
              onBlur={(e) =>
                updateCurriculum.mutate({
                  id: course.id,
                  updates: { title: e.target.value },
                })
              }
            />
            <Badge
              variant={course.is_published ? "default" : "secondary"}
              className="shrink-0 text-[10px] font-medium"
            >
              {course.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              updateCurriculum.mutate({
                id: course.id,
                updates: { is_published: !course.is_published },
              })
            }
          >
            {course.is_published ? (
              <EyeOff className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Eye className="mr-1.5 h-3.5 w-3.5" />
            )}
            {course.is_published ? "Unpublish" : "Publish"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setShowDeleteCourseDialog(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-72 shrink-0 flex-col border-r bg-muted/20">
          {/* Search */}
          <div className="border-b px-3 py-2.5">
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search content…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-xs font-semibold">Course Content</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {modules.length} module{modules.length !== 1 ? "s" : ""} ·{" "}
                {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setIsAddingModule(true)}
            >
              <Plus className="mr-1 h-3 w-3" />
              Module
            </Button>
          </div>

          {/* Add module input */}
          {isAddingModule && (
            <div className="mx-3 mb-3 space-y-2 rounded-lg border bg-background p-3">
              <Input
                placeholder="Module title"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
                className="h-8 text-sm"
                autoFocus
              />
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleAddModule}
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => {
                    setIsAddingModule(false)
                    setNewModuleTitle("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Module list */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {filteredModules.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 opacity-25" />
                <p className="text-xs">No modules yet</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={modules.map((m: any) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {filteredModules.map((module: any) => (
                      <SortableModule key={module.id} module={module}>
                        <div className="rounded-lg border bg-background">
                          {/* Module header */}
                          <div className="flex items-center gap-1 px-3 py-2">
                            <Input
                              defaultValue={module.title}
                              className="h-7 flex-1 border-0 bg-transparent px-0 text-xs font-semibold shadow-none focus-visible:ring-0"
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
                              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
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

                          {/* Lessons */}
                          <div className="border-t">
                            {(module.lessons || []).map((lesson: any) => (
                              <button
                                key={lesson.id}
                                className={`group flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/60 ${
                                  selectedLessonId === lesson.id
                                    ? "bg-primary/5 font-medium text-primary"
                                    : "text-muted-foreground"
                                }`}
                                onClick={() => setSelectedLessonId(lesson.id)}
                              >
                                <ChevronRight
                                  className={`h-3 w-3 shrink-0 transition-transform ${selectedLessonId === lesson.id ? "rotate-90 text-primary" : ""}`}
                                />
                                <span className="flex-1 truncate">
                                  {lesson.title}
                                </span>
                                <Trash2
                                  className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setConfirmDelete({
                                      type: "lesson",
                                      id: lesson.id,
                                      label: lesson.title,
                                    })
                                  }}
                                />
                              </button>
                            ))}

                            {addingLessonForModule === module.id ? (
                              <div className="space-y-2 p-3">
                                <Input
                                  placeholder="Lesson title"
                                  className="h-7 text-xs"
                                  value={newLessonTitle}
                                  onChange={(e) =>
                                    setNewLessonTitle(e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    handleAddLesson(module.id)
                                  }
                                  autoFocus
                                />
                                <div className="flex gap-1.5">
                                  <Button
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => handleAddLesson(module.id)}
                                  >
                                    Add
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={() => {
                                      setAddingLessonForModule(null)
                                      setNewLessonTitle("")
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <button
                                className="flex w-full items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                                onClick={() =>
                                  setAddingLessonForModule(module.id)
                                }
                              >
                                <Plus className="h-3 w-3" />
                                Add lesson
                              </button>
                            )}
                          </div>
                        </div>
                      </SortableModule>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </aside>

        {/* Main editor */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-8 py-7">
            <Tabs defaultValue={selectedLesson ? "lesson" : "details"}>
              <TabsList className="mb-7 h-9">
                <TabsTrigger value="details" className="text-sm">
                  Course Details
                </TabsTrigger>
                <TabsTrigger
                  value="lesson"
                  disabled={!selectedLesson}
                  className="text-sm"
                >
                  {selectedLesson ? selectedLesson.title : "Select a Lesson"}
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
                  <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-muted-foreground">
                    <BookOpen className="h-8 w-8 opacity-25" />
                    <p className="text-sm">
                      Select a lesson from the sidebar to edit
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Delete module/lesson dialog */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                "{confirmDelete?.label}"
              </span>{" "}
              {confirmDelete?.type === "module"
                ? "and all its lessons will be permanently deleted."
                : "will be permanently deleted."}
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
                } else {
                  await deleteLesson.mutateAsync(confirmDelete!.id)
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

      {/* Delete course dialog */}
      <AlertDialog
        open={showDeleteCourseDialog}
        onOpenChange={setShowDeleteCourseDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                "{course.title}"
              </span>
              , all its modules and lessons will be permanently deleted. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                await deleteCurriculum.mutateAsync(course.id)
                toast.success("Course deleted")
                navigate("/", { state: { tab: "training" } })
              }}
            >
              Delete course
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
    <div className="space-y-7">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Title</label>
        <Input
          defaultValue={lesson.title}
          className="text-base font-medium"
          onBlur={(e) =>
            updateLesson.mutate({
              id: lesson.id,
              updates: { title: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          defaultValue={lesson.description || ""}
          placeholder="Brief summary of this lesson"
          className="resize-none"
          rows={2}
          onBlur={(e) =>
            updateLesson.mutate({
              id: lesson.id,
              updates: { description: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Cloudflare Stream ID</label>
        <Input
          defaultValue={lesson.cf_stream_id || ""}
          className="font-mono text-sm"
          placeholder="Paste the video ID from Cloudflare Stream"
          onBlur={(e) =>
            updateLesson.mutate({
              id: lesson.id,
              updates: { cf_stream_id: e.target.value },
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          Found in your Cloudflare Stream dashboard under the video details.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Lesson Content</label>
        <div className="overflow-hidden rounded-lg border">
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

      <div className="rounded-xl border bg-muted/20 p-5">
        <QuizBuilder
          quiz={lesson.quiz}
          onSave={(quiz) =>
            updateLesson.mutate({ id: lesson.id, updates: { quiz } })
          }
        />
      </div>
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
  const { data: categories = [] } = useCourseCategories()
  const [categoryId, setCategoryId] = useState(course.category_id || "")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { data: curriculumTags } = useCurriculumTags(course.id)
  const updateCategory = useUpdateCurriculumCategory()
  const setTags = useSetCurriculumTags()

  useEffect(() => {
    if (curriculumTags) {
      setSelectedTags(curriculumTags.map((ct) => ct.tag_id))
    }
  }, [curriculumTags])

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
    <div className="space-y-7">
      {/* Thumbnail */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Thumbnail</label>
        <div className="flex items-start gap-4">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt="Course thumbnail"
              className="h-28 w-44 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex h-28 w-44 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted text-xs text-muted-foreground">
              No thumbnail
            </div>
          )}
          <div className="space-y-2 pt-1">
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
              <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
              {course.thumbnail_url ? "Replace" : "Upload Thumbnail"}
            </Button>
            {course.thumbnail_url && (
              <Button
                variant="ghost"
                size="sm"
                className="block text-muted-foreground hover:text-destructive"
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
            <p className="text-[11px] text-muted-foreground">
              Recommended: 16:9, at least 800×450px
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          defaultValue={course.description ?? ""}
          placeholder="What will learners gain from this course?"
          rows={3}
          className="resize-none"
          onBlur={(e) =>
            updateCurriculum.mutate(
              { id: course.id, updates: { description: e.target.value } },
              { onSuccess: onUpdate }
            )
          }
        />
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Category</label>
        <Select
          value={categoryId || "none"}
          onValueChange={(v) => {
            const newValue = v === "none" ? null : v
            setCategoryId(newValue || "")
            updateCategory.mutate({ id: course.id, categoryId: newValue })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tags</label>
        <TagSelector
          selectedTagIds={selectedTags}
          onChange={(ids) => {
            setSelectedTags(ids)
            setTags.mutate({ curriculumId: course.id, tagIds: ids })
          }}
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: module.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative ${isDragging ? "z-50 opacity-80 shadow-lg" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2.5 left-2 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="pl-6">{children}</div>
    </div>
  )
}
