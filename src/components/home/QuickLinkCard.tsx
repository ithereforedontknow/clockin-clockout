import { ExternalLink } from "lucide-react"

export function QuickLinkCard({
  eyebrow,
  title,
  description,
  href,
  label,
  icon: Icon,
}: any) {
  return (
    <div className="rounded-xl bg-primary p-5 text-primary-foreground shadow-md transition-transform active:scale-[0.98]">
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] leading-none font-bold tracking-[0.1em] uppercase opacity-70">
            {eyebrow}
          </p>
          <p className="truncate text-sm leading-tight font-bold">{title}</p>
          <p className="line-clamp-2 text-xs leading-normal opacity-80">
            {description}
          </p>
        </div>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-white py-2 text-xs font-bold text-primary transition-colors hover:bg-white/90"
      >
        {label}
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}
