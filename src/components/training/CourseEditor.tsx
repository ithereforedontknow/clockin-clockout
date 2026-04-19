import { useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Trash2,
  Plus,
  GripVertical,
  ImagePlus,
  ChevronRight,
  Eye,
  EyeOff,
  X,
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
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { QuizBuilder } from "@/components/training/QuizBuilder"
import { TagSelector } from "@/components/training/TagSelector"

import {
  useCurriculumDetail,
  useUpdateCurriculum,
  useDeleteCurriculum,
  useCreateModule,
  useDeleteModule,
  useUpdateModule,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useCourseCategories,
  useUpdateCurriculumCategory,
  useCurriculumTags,
  useSetCurriculumTags,
} from "@/lib/queries"

export function CourseEditor() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Data
  const { data: course, isLoading } = useCurriculumDetail(courseId!)

  // Mutations
  const updateCurriculum = useUpdateCurriculum()
  const deleteCurriculum = useDeleteCurriculum()
  const createModule = useCreateModule()
  const deleteModule = useDeleteModule()
  const updateModule = useUpdateModule()
  const createLesson = useCreateLesson()
  const deleteLesson = useDeleteLesson()

  // State
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [addingLessonForModule, setAddingLessonForModule] = useState<
    string | null
  >(null)
  const [newLessonTitle, setNewLessonTitle] = useState("")

  // Dialogs
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "course" | "module" | "lesson"
    id: string
    label: string
  } | null>(null)

  if (isLoading)
    return (
      <div className="flex h-[calc(100vh-100px)] animate-pulse items-center justify-center text-xs font-bold tracking-widest text-muted-foreground uppercase">
        Loading Course Workspace...
      </div>
    )
  if (!course)
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center text-xs font-bold tracking-widest text-muted-foreground uppercase">
        Course not found
      </div>
    )

  const modules = course.modules || []
  const activeLesson = activeLessonId
    ? modules
        .flatMap((m: any) => m.lessons || [])
        .find((l: any) => l.id === activeLessonId)
    : null

  // Handlers
  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return
    await createModule.mutateAsync({
      curriculum_id: course.id,
      title: newModuleTitle.trim(),
      order_index: modules.length,
      description: null,
    })
    setNewModuleTitle("")
    toast.success("Module added")
    queryClient.invalidateQueries({ queryKey: ["curriculum", course.id] })
  }

  const handleAddLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return
    await createLesson.mutateAsync({
      module_id: moduleId,
      curriculum_id: course.id,
      title: newLessonTitle.trim(),
      order_index: 0,
      description: null,
    })
    setNewLessonTitle("")
    setAddingLessonForModule(null)
    toast.success("Lesson added")
    queryClient.invalidateQueries({ queryKey: ["curriculum", course.id] })
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

  return (
    <div className="flex h-[calc(100vh-100px)] animate-in flex-col overflow-hidden rounded-2xl border bg-background shadow-sm duration-500 fade-in">
      {/* Top Navigation Bar */}
      <header className="flex shrink-0 flex-col justify-between gap-4 border-b bg-card px-6 py-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/training")}
            className="h-8 w-8 shrink-0 rounded-full bg-muted/50 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex min-w-0 flex-col">
            <Input
              defaultValue={course.title}
              className="h-7 max-w-sm truncate border-none bg-transparent px-0 text-lg font-bold shadow-none focus-visible:ring-0 sm:max-w-md"
              onBlur={(e) =>
                updateCurriculum.mutate({
                  id: course.id,
                  updates: { title: e.target.value },
                })
              }
            />
            <div className="mt-0.5 flex items-center gap-2 px-1">
              <Badge
                variant={course.is_published ? "default" : "secondary"}
                className="h-4 px-1.5 text-[9px] font-bold tracking-widest uppercase"
              >
                {course.is_published ? "Published Live" : "Draft Mode"}
              </Badge>
              <span className="rounded-sm bg-emerald-50 px-1.5 text-[9px] font-bold tracking-widest text-emerald-600 uppercase">
                Auto-saving active
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant={course.is_published ? "secondary" : "default"}
            size="sm"
            className="h-9 text-xs font-bold shadow-sm"
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
            {course.is_published ? "Unpublish" : "Publish Course"}
          </Button>
        </div>
      </header>

      {/* Main Layout (Sidebar + Canvas) */}
      <div className="flex min-h-0 flex-1">
        {/* LEFT SIDEBAR: Structure Tree */}
        <aside className="flex w-80 shrink-0 flex-col border-r bg-muted/10">
          <div className="flex flex-col gap-3 border-b bg-background p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                Course Structure
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="New Module Title..."
                className="h-8 border-none bg-muted/50 text-xs shadow-none focus-visible:ring-1"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
              />
              <Button
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleAddModule}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-3">
            {modules.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground italic">
                Add a module to begin structuring your course.
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
                  <div className="space-y-3">
                    {modules.map((mod: any) => (
                      <DraggableModule
                        key={mod.id}
                        mod={mod}
                        updateModule={updateModule}
                        setConfirmDelete={setConfirmDelete}
                        activeLessonId={activeLessonId}
                        setActiveLessonId={setActiveLessonId}
                        addingLessonForModule={addingLessonForModule}
                        setAddingLessonForModule={setAddingLessonForModule}
                        newLessonTitle={newLessonTitle}
                        setNewLessonTitle={setNewLessonTitle}
                        handleAddLesson={handleAddLesson}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </ScrollArea>
        </aside>

        {/* MAIN CANVAS: Contextual Editor */}
        <ScrollArea className="relative flex-1 bg-background">
          <div className="mx-auto max-w-3xl space-y-8 p-6 sm:p-10">
            {!activeLessonId ? (
              <CourseDetailsEditor
                course={course}
                onUpdate={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["curriculum", course.id],
                  })
                }
                setConfirmDelete={setConfirmDelete}
              />
            ) : activeLesson ? (
              <LessonEditor lesson={activeLesson} />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground italic">
                Select a lesson to edit.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Permanently Delete?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-bold text-foreground">
                "{confirmDelete?.label}"
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive font-bold text-white hover:bg-destructive/90"
              onClick={async () => {
                if (confirmDelete?.type === "course") {
                  await deleteCurriculum.mutateAsync(confirmDelete.id)
                  toast.success("Course deleted")
                  navigate("/training")
                } else if (confirmDelete?.type === "module") {
                  await deleteModule.mutateAsync(confirmDelete.id)
                  toast.success("Module deleted")
                } else if (confirmDelete?.type === "lesson") {
                  await deleteLesson.mutateAsync(confirmDelete.id)
                  toast.success("Lesson deleted")
                  setActiveLessonId(null)
                }
                setConfirmDelete(null)
              }}
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────────────

// FIX: DraggableModule strictly applies listeners ONLY to the drag handle!
function DraggableModule({
  mod,
  updateModule,
  setConfirmDelete,
  activeLessonId,
  setActiveLessonId,
  addingLessonForModule,
  setAddingLessonForModule,
  newLessonTitle,
  setNewLessonTitle,
  handleAddLesson,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`overflow-hidden rounded-xl border bg-card shadow-sm transition-opacity ${isDragging ? "opacity-50 ring-2 ring-primary" : ""}`}
    >
      {/* Module Header */}
      <div className="group flex items-center gap-1 border-b bg-muted/30 p-2">
        {/* DRAG HANDLE: Only this div captures drag events */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded-md p-1.5 text-muted-foreground/30 transition-colors hover:bg-muted hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <Input
          defaultValue={mod.title}
          className="h-7 flex-1 border-none bg-transparent px-1 text-xs font-bold shadow-none focus-visible:ring-1"
          onBlur={(e) =>
            updateModule.mutate({
              id: mod.id,
              updates: { title: e.target.value },
            })
          }
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
          onClick={() =>
            setConfirmDelete({ type: "module", id: mod.id, label: mod.title })
          }
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Lessons */}
      <div className="space-y-0.5 p-1.5">
        {mod.lessons?.map((les: any) => (
          <button
            key={les.id}
            onClick={() => setActiveLessonId(les.id)}
            className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeLessonId === les.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2 truncate pr-2">
              <ChevronRight
                className={`h-3 w-3 ${activeLessonId === les.id ? "rotate-90" : ""}`}
              />
              {les.title}
            </span>
            <Trash2
              className={`h-3 w-3 opacity-0 group-hover:opacity-100 hover:text-red-400 ${activeLessonId === les.id ? "text-primary-foreground/50" : "text-muted-foreground"}`}
              onClick={(e) => {
                e.stopPropagation()
                setConfirmDelete({
                  type: "lesson",
                  id: les.id,
                  label: les.title,
                })
              }}
            />
          </button>
        ))}

        {/* Add Lesson Input */}
        {addingLessonForModule === mod.id ? (
          <div className="mt-1 flex items-center gap-1 rounded-lg border border-dashed bg-muted/20 p-1">
            <Input
              autoFocus
              placeholder="Lesson title..."
              className="h-7 bg-background text-xs shadow-sm"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLesson(mod.id)}
            />
            <Button
              size="sm"
              className="h-7 px-2 text-[10px] font-bold"
              onClick={() => handleAddLesson(mod.id)}
            >
              Add
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:bg-muted"
              onClick={() => {
                setAddingLessonForModule(null)
                setNewLessonTitle("")
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setAddingLessonForModule(mod.id)}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> Add Lesson
          </button>
        )}
      </div>
    </div>
  )
}

function CourseDetailsEditor({ course, onUpdate, setConfirmDelete }: any) {
  const updateCurriculum = useUpdateCurriculum()
  const { data: categories = [] } = useCourseCategories()
  const { data: tags = [] } = useCurriculumTags(course.id)
  const updateCategory = useUpdateCurriculumCategory()
  const setTags = useSetCurriculumTags()
  const thumbRef = useRef<HTMLInputElement>(null)

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split(".").pop()
    const path = `thumbnails/${course.id}.${ext}`
    await supabase.storage
      .from("course-assets")
      .upload(path, file, { upsert: true })
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
    <div className="animate-in space-y-8 duration-500 fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Course Settings</h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Manage the metadata and discovery settings for this curriculum.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Course Description
        </label>
        <Textarea
          defaultValue={course.description ?? ""}
          placeholder="What will your team learn?"
          className="h-24 resize-none bg-muted/20 transition-colors focus-visible:bg-background"
          onBlur={(e) =>
            updateCurriculum.mutate({
              id: course.id,
              updates: { description: e.target.value },
            })
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Course Category
          </label>
          <Select
            value={course.category_id || "none"}
            onValueChange={(v) =>
              updateCategory.mutate({
                id: course.id,
                categoryId: v === "none" ? null : v,
              })
            }
          >
            <SelectTrigger className="bg-muted/20 font-bold">
              <SelectValue placeholder="Select Category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Uncategorized</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Course Tags
          </label>
          <TagSelector
            selectedTagIds={tags.map((t: any) => t.tag_id)}
            onChange={(ids: string[]) =>
              setTags.mutate({ curriculumId: course.id, tagIds: ids })
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Cover Image
        </label>
        <div className="flex items-center gap-6 rounded-xl border bg-muted/10 p-5 shadow-sm">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt="Cover"
              className="h-24 w-40 rounded-lg border bg-background object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed bg-muted/50">
              <ImagePlus className="h-6 w-6 text-muted-foreground/30" />
            </div>
          )}
          <div className="space-y-2">
            <input
              ref={thumbRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailUpload}
            />
            <Button
              variant="secondary"
              size="sm"
              className="font-bold shadow-sm"
              onClick={() => thumbRef.current?.click()}
            >
              Upload New Image
            </Button>
            <p className="text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
              16:9 Aspect Ratio (Min 800x450)
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-10">
        <Button
          variant="ghost"
          className="gap-2 px-3 font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() =>
            setConfirmDelete({
              type: "course",
              id: course.id,
              label: course.title,
            })
          }
        >
          <Trash2 className="h-4 w-4" /> Delete Entire Course
        </Button>
      </div>
    </div>
  )
}

function LessonEditor({ lesson }: any) {
  const updateLesson = useUpdateLesson()
  const [html, setHtml] = useState(lesson.content_html || "")

  return (
    <div className="animate-in space-y-8 duration-300 fade-in">
      <div className="border-b pb-4">
        <Input
          defaultValue={lesson.title}
          className="h-12 rounded-none border-none bg-transparent px-0 text-3xl font-bold shadow-none focus-visible:ring-0"
          onBlur={(e) =>
            updateLesson.mutate({
              id: lesson.id,
              updates: { title: e.target.value },
            })
          }
        />
        <p className="mt-1 ml-0.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Lesson Editor
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Video Content (Cloudflare ID)
        </label>
        <Input
          defaultValue={lesson.cf_stream_id || ""}
          placeholder="e.g. 5a4b123..."
          className="bg-muted/20 font-mono text-sm"
          onBlur={(e) =>
            updateLesson.mutate({
              id: lesson.id,
              updates: { cf_stream_id: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Written Content
        </label>
        <div className="overflow-hidden rounded-xl border shadow-sm">
          <RichTextEditor
            content={html}
            onChange={(val) => {
              setHtml(val)
              updateLesson.mutate({
                id: lesson.id,
                updates: { content_html: val },
              })
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Knowledge Check (Quiz)
        </label>
        <div className="rounded-xl border bg-muted/10 p-6 shadow-sm">
          <QuizBuilder
            quiz={lesson.quiz}
            onSave={(quiz: any) =>
              updateLesson.mutate({ id: lesson.id, updates: { quiz } })
            }
          />
        </div>
      </div>
    </div>
  )
}
