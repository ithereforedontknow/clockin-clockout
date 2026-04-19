import { ArrowRight } from "lucide-react"

interface DiffProps {
  label: string
  oldValue: string | null
  newValue: string
}

export function DiffViewer({ label, oldValue, newValue }: DiffProps) {
  return (
    <div className="flex flex-col gap-1 py-1">
      <span className="text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded bg-red-50/50 px-1 text-muted-foreground line-through decoration-red-300">
          {oldValue || "Empty"}
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className="rounded bg-emerald-50 px-1 font-bold text-emerald-700 tabular-nums">
          {newValue}
        </span>
      </div>
    </div>
  )
}
