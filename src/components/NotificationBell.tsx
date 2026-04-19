import { formatDistanceToNow } from "date-fns"
import type { TabId } from "@/components/AppShell"
import {
  Bell,
  CheckCheck,
  Calendar,
  User,
  Timer,
  AlertCircle,
  UserPlus,
  Loader2,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/lib/queries"
import type { AppNotification, NotificationType } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface Props {
  employeeId: string
  onNavigate: (tab: TabId) => void
}

const NOTIF_ICON: Record<NotificationType, typeof Bell> = {
  timeoff_approved: Calendar,
  timeoff_denied: Calendar,
  info_change_approved: User,
  info_change_denied: User,
  correction_approved: Timer,
  correction_denied: Timer,
  late_clock_in: AlertCircle,
  new_employee: UserPlus,
  course_completed: Award,
  course_assigned: Bell,
}

const NOTIF_COLOR: Record<NotificationType, string> = {
  timeoff_approved: "text-emerald-600 bg-emerald-50 border-emerald-100",
  timeoff_denied: "text-red-600 bg-red-50 border-red-100",
  info_change_approved: "text-emerald-600 bg-emerald-50 border-emerald-100",
  info_change_denied: "text-red-600 bg-red-50 border-red-100",
  correction_approved: "text-emerald-600 bg-emerald-50 border-emerald-100",
  correction_denied: "text-red-600 bg-red-50 border-red-100",
  late_clock_in: "text-amber-600 bg-amber-50 border-amber-100",
  new_employee: "text-blue-600 bg-blue-50 border-blue-100",
  course_completed: "text-emerald-600 bg-emerald-50 border-emerald-100",
  course_assigned: "text-blue-600 bg-blue-50 border-blue-100",
}

export function NotificationBell({ employeeId, onNavigate }: Props) {
  const { data: notifications = [], isLoading } = useNotifications(employeeId)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllRead()

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleClick(n: AppNotification) {
    if (!n.read) await markRead.mutateAsync({ id: n.id, employeeId })
    if (n.link_tab) onNavigate(n.link_tab as TabId)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full transition-colors hover:bg-muted"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full border border-background bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="mt-2 w-80 overflow-hidden border-none p-0 shadow-2xl ring-1 ring-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-3">
          <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
            Notifications
          </span>
          {unreadCount > 0 && (
            <button
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate(employeeId)}
              className="flex items-center gap-1 text-[10px] font-bold text-primary transition-all hover:underline disabled:opacity-50"
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
              Mark all read
            </button>
          )}
        </div>

        {/* Content Area */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                Syncing...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                <Bell className="h-5 w-5 opacity-20" />
              </div>
              <p className="text-xs font-medium italic">Your inbox is clear</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((n) => {
                const Icon = NOTIF_ICON[n.type] ?? Bell
                const colorCls =
                  NOTIF_COLOR[n.type] ??
                  "text-muted-foreground bg-muted border-transparent"

                return (
                  <button
                    key={n.id}
                    className={cn(
                      "group relative flex w-full items-start gap-3 px-4 py-3.5 text-left transition-all",
                      !n.read
                        ? "bg-primary/[0.02] hover:bg-primary/[0.04]"
                        : "opacity-70 hover:bg-muted/40 hover:opacity-100"
                    )}
                    onClick={() => handleClick(n)}
                  >
                    {/* Unread Indicator Bar */}
                    {!n.read && (
                      <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-primary" />
                    )}

                    <div
                      className={cn(
                        "mt-0.5 shrink-0 rounded-lg border p-1.5 shadow-sm transition-transform group-hover:scale-105",
                        colorCls
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p
                        className={cn(
                          "text-xs leading-tight font-bold tracking-tight",
                          !n.read ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[9px] font-black tracking-tighter text-muted-foreground/40 uppercase">
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    {!n.read && (
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-muted/20 p-2">
          <p className="text-center text-[9px] font-black tracking-[0.3em] text-muted-foreground/40 uppercase">
            End of stream
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
