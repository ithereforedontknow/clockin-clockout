import { useState } from "react"
import { Check, X, Tag } from "lucide-react"
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
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface TagSelectorProps {
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const { data: allTags = [] } = useCourseTags()
  const [open, setOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")

  const selectedTags = allTags.filter((tag) => selectedTagIds.includes(tag.id))

  const handleToggle = (tagId: string) => {
    onChange(
      selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId]
    )
  }

  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name) return
    const { data, error } = await supabase
      .from("course_tags")
      .insert({ name })
      .select()
      .single()
    if (error) {
      toast.error("Failed to create tag")
      return
    }
    onChange([...selectedTagIds, data.id])
    setNewTagName("")
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="gap-1 pr-1 text-xs"
          >
            {tag.name}
            <button
              onClick={() => handleToggle(tag.id)}
              className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-foreground/10"
              aria-label={`Remove ${tag.name}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        {selectedTags.length === 0 && (
          <span className="text-xs text-muted-foreground">
            No tags selected
          </span>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Tag className="h-3 w-3" />
            Add Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags…" />
            <CommandList>
              <CommandEmpty>
                <div className="space-y-2 p-3">
                  <p className="text-xs text-muted-foreground">No tags found</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="New tag name"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                      className="h-7 text-xs"
                    />
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {allTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => handleToggle(tag.id)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 transition-opacity ${
                        selectedTagIds.includes(tag.id)
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
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
