import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus,
  LayoutGrid,
  Search,
  MoreHorizontal,
  Copy,
  Pencil,
  GraduationCap,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  useCurriculums,
  useCourseCategories,
  useCreateCurriculum,
  useDuplicateCurriculum,
} from "@/lib/queries"
import { BulkAssignDialog } from "@/components/training/BulkAssignDialog"
import { BulkUnassignDialog } from "@/components/training/BulkUnassignDialog"
import type { Curriculum } from "@/lib/supabase"

export function ManageCoursesPanel() {
  const navigate = useNavigate()
  const { data: curriculums = [], isLoading } = useCurriculums()
  const { data: categories = [] } = useCourseCategories()

  const createCurriculum = useCreateCurriculum()
  const duplicateCourse = useDuplicateCurriculum()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [search, setSearch] = useState("")

  const filteredCourses = useMemo(() => {
    return curriculums.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase())
    )
  }, [curriculums, search])

  const handleCreate = async () => {
    if (!title.trim()) return toast.error("Title is required")
    await createCurriculum.mutateAsync({
      title: title.trim(),
      description: desc.trim() || null,
      is_published: false,
    })
    toast.success("Course created")
    setOpen(false)
    setTitle("")
    setDesc("")
  }

  return (
    <div className="animate-in space-y-6 duration-500 fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-none bg-muted/40 shadow-none">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Total Courses
            </p>
            <p className="mt-1 text-3xl font-black tracking-tighter tabular-nums">
              {curriculums.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none bg-emerald-50/50 shadow-none dark:bg-emerald-900/50">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase dark:text-emerald-400">
              Published Live
            </p>
            <p className="mt-1 text-3xl font-black tracking-tighter text-emerald-600 tabular-nums dark:text-emerald-300">
              {curriculums.filter((c) => c.is_published).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none bg-amber-50/50 shadow-none dark:bg-amber-900/50">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold tracking-widest text-amber-700 uppercase">
              Drafts
            </p>
            <p className="mt-1 text-3xl font-black tracking-tighter text-amber-600 tabular-nums">
              {curriculums.filter((c) => !c.is_published).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search courses..."
            className="h-10 border-none bg-muted/30 pl-10 shadow-none focus-visible:ring-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {/* SAFE DIALOGS: They now fallback to Role/Dept filters automatically */}
          <BulkUnassignDialog />
          <BulkAssignDialog />

          <Button
            onClick={() => setOpen(true)}
            className="h-10 font-bold shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Course
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pl-6 text-[10px] font-bold tracking-widest uppercase">
                Curriculum
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                Category
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                Status
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold tracking-widest uppercase">
                Created
              </TableHead>
              <TableHead className="w-12 pr-6 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 animate-pulse text-center text-xs font-bold tracking-widest text-muted-foreground uppercase"
                >
                  Loading Content...
                </TableCell>
              </TableRow>
            ) : filteredCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <LayoutGrid className="mb-3 h-8 w-8 opacity-20" />
                    <p className="text-sm font-medium">No courses found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses.map((course: Curriculum) => {
                const cat = categories.find(
                  (c: any) => c.id === course.category_id
                )
                return (
                  <TableRow
                    key={course.id}
                    className="group cursor-pointer transition-colors hover:bg-primary/[0.02]"
                    onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                  >
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-4">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            className="h-10 w-16 rounded-md border object-cover shadow-sm"
                            alt=""
                          />
                        ) : (
                          <div className="flex h-10 w-16 items-center justify-center rounded-md border bg-muted">
                            <GraduationCap className="h-4 w-4 opacity-30" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold transition-colors group-hover:text-primary">
                            {course.title}
                          </p>
                          <p className="max-w-[300px] truncate text-[11px] text-muted-foreground">
                            {course.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cat ? (
                        <Badge
                          variant="secondary"
                          className="text-[9px] font-bold tracking-tighter uppercase"
                        >
                          {cat.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold uppercase ${course.is_published ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                      >
                        {course.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-[11px] font-bold text-muted-foreground tabular-nums">
                      {format(new Date(course.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell
                      className="pr-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/admin/courses/${course.id}/edit`)
                            }
                            className="text-xs font-medium"
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Content
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => duplicateCourse.mutate(course.id)}
                            disabled={duplicateCourse.isPending}
                            className="text-xs font-medium"
                          >
                            <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                            Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Creation Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Create New Course
            </DialogTitle>
            <DialogDescription>
              Add a title and description, then build out the modules in the
              editor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Course Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Security Compliance 101"
                className="h-10 font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Brief Description
              </label>
              <Textarea
                placeholder="What will they learn?"
                className="h-24 resize-none"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createCurriculum.isPending}
              className="font-bold"
            >
              {createCurriculum.isPending
                ? "Creating..."
                : "Initialize Course Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
