import { useState } from "react"
import { Check, X, Loader2, Clock, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Option {
  label: string
  value: string
}

interface Props {
  label: string
  value: string
  options: Option[]
  onSave: (v: string) => Promise<void>
  required?: boolean
  isPending?: boolean
}

export function EditableSelectField({
  label,
  value,
  options,
  onSave,
  required,
  isPending,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  const displayValue = options.find((o) => o.value === value)?.label || value

  async function handleSave() {
    if (draft === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(draft)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="group space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {isPending && (
          <Badge
            variant="outline"
            className="h-4 animate-pulse gap-1 border-amber-200 bg-amber-50 px-1 text-[9px] font-bold text-amber-600"
          >
            <Clock className="h-2.5 w-2.5" /> Pending
          </Badge>
        )}
      </div>

      {editing ? (
        <div className="flex animate-in items-center gap-1 duration-200 zoom-in-95 fade-in">
          <Select value={draft} onValueChange={setDraft}>
            <SelectTrigger className="h-9 text-sm shadow-none focus:ring-1">
              <SelectValue placeholder={`Select ${label}...`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 shrink-0 text-emerald-600 hover:bg-emerald-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 shrink-0 text-destructive hover:bg-red-50"
            onClick={() => {
              setDraft(value)
              setEditing(false)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`flex h-9 items-center justify-between rounded-lg border border-transparent px-3 transition-all ${isPending ? "cursor-not-allowed bg-muted/30 opacity-60" : "cursor-pointer hover:border-border hover:bg-muted/50"}`}
          onClick={() => !isPending && setEditing(true)}
        >
          <span className="truncate text-sm font-medium tabular-nums">
            {displayValue || (
              <span className="text-xs font-normal text-muted-foreground/50 italic">
                Not set
              </span>
            )}
          </span>
          {!isPending && (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-100" />
          )}
        </div>
      )}
    </div>
  )
}
