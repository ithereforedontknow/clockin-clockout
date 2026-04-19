import { Check, Loader2 } from "lucide-react"

export function BulkActionBar({
  count,
  onApprove,
  onDeny,
  isPending,
  onClear,
}: any) {
  if (count === 0) return null

  return (
    <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 animate-in items-center gap-6 rounded-full bg-slate-900 px-6 py-3 text-white shadow-2xl slide-in-from-bottom-4">
      <div className="flex flex-col">
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Selected
        </span>
        <span className="text-xs font-bold">{count} Requests</span>
      </div>
      <div className="h-6 w-[1px] bg-slate-700" />
      <div className="flex items-center gap-3">
        <button
          onClick={onApprove}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold transition-colors hover:bg-emerald-500"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}{" "}
          Approve
        </button>
        <button
          onClick={onDeny}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full border border-red-900/50 bg-red-600/20 px-4 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-600"
        >
          Deny
        </button>
      </div>
      <button
        onClick={onClear}
        className="text-[10px] font-bold text-slate-500 hover:text-slate-300"
      >
        Clear
      </button>
    </div>
  )
}
