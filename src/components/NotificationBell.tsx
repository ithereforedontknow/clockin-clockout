import { formatDistanceToNow } from "date-fns"
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
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/lib/queries"
import type { AppNotification, NotificationType } from "@/lib/supabase"
import type { TabId } from "@/components/Appshell"

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
  timeoff_approved: "text-green-600 bg-green-50 dark:bg-green-950",
  timeoff_denied: "text-destructive bg-destructive/10",
  info_change_approved: "text-green-600 bg-green-50 dark:bg-green-950",
  info_change_denied: "text-destructive bg-destructive/10",
  correction_approved: "text-green-600 bg-green-50 dark:bg-green-950",
  correction_denied: "text-destructive bg-destructive/10",
  late_clock_in: "text-amber-600 bg-amber-50 dark:bg-amber-950",
  new_employee: "text-blue-600 bg-blue-50 dark:bg-blue-950",
  course_completed: "text-green-600 bg-green-50 dark:bg-green-950",
  course_assigned: "text-blue-600 bg-blue-50 dark:bg-blue-950",
}

export function NotificationBell({ employeeId, onNavigate }: Props) {
  const { data: notifications = [], isLoading } = useNotifications(employeeId)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllRead()

  const unread = notifications.filter((n) => !n.read)
  const unreadCount = unread.length

  async function handleClick(n: AppNotification) {
    if (!n.read) {
      await markRead.mutateAsync({ id: n.id, employeeId })
    }
    if (n.link_tab) {
      onNavigate(n.link_tab as TabId)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="text-destructive-foreground absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-destructive p-0 text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate(employeeId)}
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        {/* List */}
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((n, idx) => {
                const Icon = NOTIF_ICON[n.type] ?? Bell
                const color =
                  NOTIF_COLOR[n.type] ?? "text-muted-foreground bg-muted"
                return (
                  <div key={n.id}>
                    <button
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => handleClick(n)}
                    >
                      {/* Icon */}
                      <div
                        className={`mt-0.5 shrink-0 rounded-full p-1.5 ${color}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p
                          className={`text-sm leading-snug font-medium ${!n.read ? "" : "text-muted-foreground"}`}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs leading-snug text-muted-foreground">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!n.read && (
                        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                    {idx < notifications.length - 1 && (
                      <div className="mx-4 border-b border-border" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
