import { useState } from "react"
import { Tag, Layers, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useCourseCategories, useCourseTags } from "@/lib/queries"

export function CourseCategoriesPanel() {
  const { data: categories = [], refetch: refetchCats } = useCourseCategories()
  const { data: tags = [], refetch: refetchTags } = useCourseTags()

  return (
    <div className="grid animate-in grid-cols-1 gap-6 duration-500 fade-in md:grid-cols-2">
      <TaxonomySection
        title="Content Categories"
        icon={Layers}
        items={categories}
        table="course_categories"
        onUpdate={refetchCats}
      />
      <TaxonomySection
        title="Searchable Tags"
        icon={Tag}
        items={tags}
        table="course_tags"
        onUpdate={refetchTags}
      />
    </div>
  )
}

function TaxonomySection({ title, icon: Icon, items, table, onUpdate }: any) {
  const [val, setVal] = useState("")

  const handleAdd = async () => {
    if (!val.trim()) return
    const { error } = await supabase.from(table).insert({ name: val.trim() })
    if (!error) {
      setVal("")
      onUpdate()
      toast.success("Added to system")
    } else {
      toast.error(`Failed to add: ${error.message}`)
    }
  }
  }

  return (
    <Card className="overflow-hidden border-none bg-card shadow-none ring-1 ring-border">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <CardTitle className="flex items-center justify-between text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
          <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5" />
            {title}
          </div>
          <Badge
            variant="secondary"
            className="text-[10px] font-bold tabular-nums"
          >
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex gap-2 border-b bg-muted/5 p-4">
          <Input
            placeholder="Enter new label..."
            className="h-8 text-xs font-medium"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleAdd}
            disabled={!val.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[350px] divide-y overflow-x-hidden overflow-y-auto">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="group flex items-center justify-between px-6 py-2.5 transition-colors hover:bg-primary/[0.02]"
            >
              <span className="text-xs font-bold tracking-tight text-foreground/70">
                {item.name}
              </span>
              <button
                type="button"
                aria-label={`Delete category ${item.name || item.id}`}
                className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                onClick={async () => {
                  if (!window.confirm(`Delete "${item.name}"?`)) return
                  try {
                    const { error } = await supabase.from(table).delete().eq("id", item.id)
                    if (error) throw error
                    onUpdate()
                    toast.success("Category deleted")
                  } catch (err: any) {
                    toast.error(`Failed to delete: ${err.message}`)
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
