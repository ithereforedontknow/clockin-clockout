import { useState } from "react"
import { Plus, Trash2, Pencil, Tag, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

  async function createCategory() {
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

  async function updateCategory() {
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

  async function deleteCategory(id: string) {
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

  async function createTag() {
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

  async function updateTag() {
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

  async function deleteTag(id: string) {
    const { error } = await supabase.from("course_tags").delete().eq("id", id)
    if (error) toast.error(error.message)
    else {
      toast.success("Tag deleted")
      refetchTags()
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* Categories */}
      <TaxonomyCard
        title="Course Categories"
        icon={Layers}
        count={categories.length}
        inputValue={newCategory}
        onInputChange={setNewCategory}
        onAdd={createCategory}
        placeholder="New category name…"
        items={categories}
        onEdit={setEditingCategory}
        onDelete={(id) => deleteCategory(id)}
        emptyText="No categories yet"
      />

      {/* Tags */}
      <TaxonomyCard
        title="Course Tags"
        icon={Tag}
        count={tags.length}
        inputValue={newTag}
        onInputChange={setNewTag}
        onAdd={createTag}
        placeholder="New tag name…"
        items={tags}
        onEdit={setEditingTag}
        onDelete={(id) => deleteTag(id)}
        emptyText="No tags yet"
      />

      {/* Edit Category */}
      <EditDialog
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Edit Category"
        value={editingCategory?.name ?? ""}
        onChange={(v) => setEditingCategory({ ...editingCategory, name: v })}
        onSave={updateCategory}
      />

      {/* Edit Tag */}
      <EditDialog
        open={!!editingTag}
        onClose={() => setEditingTag(null)}
        title="Edit Tag"
        value={editingTag?.name ?? ""}
        onChange={(v) => setEditingTag({ ...editingTag, name: v })}
        onSave={updateTag}
      />
    </div>
  )
}

function TaxonomyCard({
  title,
  icon: Icon,
  count,
  inputValue,
  onInputChange,
  onAdd,
  placeholder,
  items,
  onEdit,
  onDelete,
  emptyText,
}: {
  title: string
  icon: typeof Tag
  count: number
  inputValue: string
  onInputChange: (v: string) => void
  onAdd: () => void
  placeholder: string
  items: { id: string; name: string }[]
  onEdit: (item: any) => void
  onDelete: (id: string) => void
  emptyText: string
}) {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
          <Badge
            variant="secondary"
            className="ml-auto font-normal tabular-nums"
          >
            {count}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            className="h-8 px-3"
            onClick={onAdd}
            disabled={!inputValue.trim()}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* List */}
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <span className="text-sm">{item.name}</span>
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EditDialog({
  open,
  onClose,
  title,
  value,
  onChange,
  onSave,
}: {
  open: boolean
  onClose: () => void
  title: string
  value: string
  onChange: (v: string) => void
  onSave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave()}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
