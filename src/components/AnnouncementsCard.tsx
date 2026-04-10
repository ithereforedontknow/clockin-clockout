import { useState } from "react"
import { format } from "date-fns"
import {
  Megaphone,
  Plus,
  Trash2,
  Loader2,
  Globe,
  Users,
  Pin,
  PinOff,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  usePinAnnouncement,
} from "@/lib/queries"
import type { Employee, Announcement } from "@/lib/supabase"

interface Props {
  currentEmployee: Employee
}

export function AnnouncementsCard({ currentEmployee }: Props) {
  const role = currentEmployee.role
  const canPost = role === "admin" || role === "employer"
  const employerId = role === "employer" ? currentEmployee.id : undefined

  const { data: announcements = [], isLoading } = useAnnouncements(
    currentEmployee.id,
    employerId
  )
  const createAnnouncement = useCreateAnnouncement()
  const deleteAnnouncement = useDeleteAnnouncement()
  const pinAnnouncement = usePinAnnouncement()

  const [postOpen, setPostOpen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Megaphone className="h-4 w-4 text-primary" />
            Announcements
          </CardTitle>
          {canPost && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPostOpen(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Post
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(2)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
          ) : announcements.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No announcements yet
            </p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <AnnouncementItem
                  key={a.id}
                  announcement={a}
                  currentEmployee={currentEmployee}
                  onDelete={() => {
                    deleteAnnouncement.mutate(a.id, {
                      onSuccess: () => toast.success("Announcement deleted"),
                    })
                  }}
                  onPin={() => {
                    pinAnnouncement.mutate(
                      { id: a.id, pinned: !a.pinned },
                      {
                        onSuccess: () =>
                          toast.success(a.pinned ? "Unpinned" : "Pinned"),
                      }
                    )
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PostAnnouncementDialog
        open={postOpen}
        onClose={() => setPostOpen(false)}
        currentEmployee={currentEmployee}
        onCreate={async (payload) => {
          await createAnnouncement.mutateAsync(payload)
          toast.success("Announcement posted")
          setPostOpen(false)
        }}
        isPending={createAnnouncement.isPending}
      />
    </>
  )
}

// ─── Single announcement row ──────────────────────────────────────────────────

function AnnouncementItem({
  announcement: a,
  currentEmployee,
  onDelete,
  onPin,
}: {
  announcement: Announcement & {
    author?: {
      first_name: string
      last_name: string
      avatar_url: string | null
    }
  }
  currentEmployee: Employee
  onDelete: () => void
  onPin: () => void
}) {
  const author = a.author
  const canDelete =
    a.posted_by === currentEmployee.id || currentEmployee.role === "admin"
  const canPin =
    a.posted_by === currentEmployee.id || currentEmployee.role === "admin"

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${
        a.pinned
          ? "border-primary/20 bg-primary/5"
          : "border-border bg-muted/20"
      }`}
    >
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={author?.avatar_url ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
          {author?.first_name?.[0]}
          {author?.last_name?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {a.pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
          <p className="text-sm font-medium">{a.title}</p>
          <Badge
            variant="outline"
            className={`gap-1 text-[10px] ${
              a.target === "all"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {a.target === "all" ? (
              <>
                <Globe className="h-2.5 w-2.5" />
                Company
              </>
            ) : (
              <>
                <Users className="h-2.5 w-2.5" />
                Team
              </>
            )}
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-foreground/80">{a.body}</p>
        <p className="text-[10px] text-muted-foreground">
          {author?.first_name} {author?.last_name}
          {" · "}
          {format(new Date(a.created_at), "MMM d 'at' h:mm a")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {canPin && (
          <button
            onClick={onPin}
            className="text-muted-foreground transition-colors hover:text-primary"
            title={a.pinned ? "Unpin" : "Pin to top"}
          >
            {a.pinned ? (
              <PinOff className="h-3.5 w-3.5" />
            ) : (
              <Pin className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Post dialog ──────────────────────────────────────────────────────────────

function PostAnnouncementDialog({
  open,
  onClose,
  currentEmployee,
  onCreate,
  isPending,
}: {
  open: boolean
  onClose: () => void
  currentEmployee: Employee
  onCreate: (payload: {
    title: string
    body: string
    posted_by: string
    target: "all" | "employer_team"
    target_employer_id: string | null
  }) => Promise<void>
  isPending: boolean
}) {
  const isAdmin = currentEmployee.role === "admin"
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [target, setTarget] = useState<"all" | "employer_team">(
    isAdmin ? "all" : "employer_team"
  )

  function reset() {
    setTitle("")
    setBody("")
    setTarget(isAdmin ? "all" : "employer_team")
  }

  async function handlePost() {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!body.trim()) {
      toast.error("Message is required")
      return
    }
    await onCreate({
      title: title.trim(),
      body: body.trim(),
      posted_by: currentEmployee.id,
      target,
      target_employer_id:
        target === "employer_team" ? currentEmployee.id : null,
    })
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Post Announcement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. Office Closed Friday"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Details…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="h-24 resize-none"
            />
          </div>

          {isAdmin && (
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select
                value={target}
                onValueChange={(v) => setTarget(v as "all" | "employer_team")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5" />
                      Everyone in the company
                    </div>
                  </SelectItem>
                  <SelectItem value="employer_team">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      My team only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button disabled={isPending} onClick={handlePost}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting…
              </>
            ) : (
              <>
                <Megaphone className="mr-2 h-4 w-4" />
                Post
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
