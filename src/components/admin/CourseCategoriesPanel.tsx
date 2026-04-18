import { useState } from "react"
import { Plus, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import { useCourseCategories, useCourseTags } from "@/lib/queries"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function CourseCategoriesPanel() {
  const { data: categories = [], refetch: refetchCategories } =
    useCourseCategories()
  const { data: tags = [], refetch: refetchTags } = useCourseTags()
  const [newCategory, setNewCategory] = useState("")
  const [newTag, setNewTag] = useState("")
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [editingTag, setEditingTag] = useState<any>(null)

  const createCategory = async () => {
    if (!newCategory.trim()) return
    const { error } = await supabase
      .from("course_categories")
      .insert({ name: newCategory.trim() })
    if (error) toast.error(error.message)
    else {
      toast.success("Category created")
      setNewCategory("")
      refetchCategories()
    }
  }

  const updateCategory = async () => {
    if (!editingCategory?.name.trim()) return
    const { error } = await supabase
      .from("course_categories")
      .update({ name: editingCategory.name.trim() })
      .eq("id", editingCategory.id)
    if (error) toast.error(error.message)
    else {
      toast.success("Category updated")
      setEditingCategory(null)
      refetchCategories()
    }
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from("course_categories")
      .delete()
      .eq("id", id)
    if (error) toast.error(error.message)
    else {
      toast.success("Category deleted")
      refetchCategories()
    }
  }

  const createTag = async () => {
    if (!newTag.trim()) return
    const { error } = await supabase
      .from("course_tags")
      .insert({ name: newTag.trim() })
    if (error) toast.error(error.message)
    else {
      toast.success("Tag created")
      setNewTag("")
      refetchTags()
    }
  }

  const updateTag = async () => {
    if (!editingTag?.name.trim()) return
    const { error } = await supabase
      .from("course_tags")
      .update({ name: editingTag.name.trim() })
      .eq("id", editingTag.id)
    if (error) toast.error(error.message)
    else {
      toast.success("Tag updated")
      setEditingTag(null)
      refetchTags()
    }
  }

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from("course_tags").delete().eq("id", id)
    if (error) toast.error(error.message)
    else {
      toast.success("Tag deleted")
      refetchTags()
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Course Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createCategory()}
            />
            <Button size="sm" onClick={createCategory}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCategory(cat)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCategory(cat.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Course Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New tag name"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTag()}
            />
            <Button size="sm" onClick={createTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>{tag.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingTag(tag)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTag(tag.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={() => setEditingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <Input
            value={editingCategory?.name || ""}
            onChange={(e) =>
              setEditingCategory({ ...editingCategory, name: e.target.value })
            }
            onKeyDown={(e) => e.key === "Enter" && updateCategory()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button onClick={updateCategory}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <Input
            value={editingTag?.name || ""}
            onChange={(e) =>
              setEditingTag({ ...editingTag, name: e.target.value })
            }
            onKeyDown={(e) => e.key === "Enter" && updateTag()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTag(null)}>
              Cancel
            </Button>
            <Button onClick={updateTag}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
