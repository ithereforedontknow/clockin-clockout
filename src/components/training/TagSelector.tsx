import { useState } from "react"
import { Check, Plus, X } from "lucide-react"
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
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    const { data, error } = await supabase
      .from("course_tags")
      .insert({ name: newTagName.trim() })
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
      <div className="flex flex-wrap gap-1">
        {selectedTags.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="gap-1">
            {tag.name}
            <button
              onClick={() => handleToggle(tag.id)}
              className="ml-1 rounded-full hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="mr-1 h-3 w-3" /> Add Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>
                <div className="p-2">
                  <p className="text-sm text-muted-foreground">No tags found</p>
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="New tag name"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="h-8"
                    />
                    <Button size="sm" onClick={handleCreateTag}>
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
                      className={`mr-2 h-4 w-4 ${
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
