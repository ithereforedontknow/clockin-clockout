import { useState } from "react"
import { Check, X, Tag, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useCourseTags } from "@/lib/queries"
import { supabase } from "@/lib/supabase"

export function TagSelector({ selectedTagIds, onChange }: any) {
  const { data: allTags = [] } = useCourseTags()
  const [open, setOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")

  const selectedTags = allTags.filter((t: any) => selectedTagIds.includes(t.id))

  const handleToggle = (id: string) =>
    onChange(
      selectedTagIds.includes(id)
        ? selectedTagIds.filter((x: string) => x !== id)
        : [...selectedTagIds, id]
    )

  const handleCreate = async () => {
    if (!newTagName.trim()) return
    const { data } = await supabase
      .from("course_tags")
      .insert({ name: newTagName.trim() })
      .select()
      .single()
    if (data) {
      onChange([...selectedTagIds, data.id])
      setNewTagName("")
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedTags.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">
            No tags selected
          </span>
        ) : (
          selectedTags.map((tag: any) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="gap-1 border-none bg-primary/10 py-1 text-[10px] font-bold tracking-tight text-primary uppercase"
            >
              {tag.name}
              <button
                onClick={() => handleToggle(tag.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-background text-xs font-bold"
          >
            <Tag className="mr-2 h-3.5 w-3.5" /> Manage Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search tags..."
              className="h-9 text-xs"
            />
            <CommandList>
              <CommandEmpty className="p-2">
                <div className="flex flex-col gap-2">
                  <p className="mb-1 text-center text-xs text-muted-foreground">
                    No tag found.
                  </p>
                  <Input
                    placeholder="Create new tag..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    className="h-8 w-full text-xs font-bold"
                    onClick={handleCreate}
                    disabled={!newTagName.trim()}
                  >
                    <Plus className="mr-2 h-3 w-3" /> Create Tag
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {allTags.map((tag: any) => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => handleToggle(tag.id)}
                    className="text-xs font-medium"
                  >
                    <Check
                      className={`mr-2 h-3.5 w-3.5 ${selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0"}`}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
