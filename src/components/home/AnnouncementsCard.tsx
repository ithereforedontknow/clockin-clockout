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
  MoreHorizontal,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  usePinAnnouncement,
} from "@/lib/queries"
import { usePermissions } from "@/lib/auth/permissions"
import type { Employee } from "@/lib/supabase"
import { ScrollArea } from "../ui/scroll-area"

const BADGE_STYLE = {
  all: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  team: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
}

interface Props {
  currentEmployee: Employee
}
interface PostPayload {
  title: string
  body: string
  posted_by: string
  target: "all" | "employer_team"
  target_employer_id: string | null
}

export function AnnouncementsCard({ currentEmployee }: Props) {
  const { hasPermission, isEmployer } = usePermissions()
  const canPost = hasPermission("manage_employees")
  const employerId = isEmployer ? currentEmployee.id : undefined
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
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Megaphone className="h-4 w-4 text-primary" />
            Announcements
          </CardTitle>
          {canPost && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setPostOpen(true)}
            >
              <Plus className="h-3 w-3" />
              Post
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <ScrollArea className="h-[450px]">
              {" "}
              {/* Fixed height for scalability */}
              <div className="divide-y">
                {isLoading ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </div>
                ) : announcements.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground italic">
                    No announcements yet
                  </p>
                ) : (
                  announcements.map((a) => (
                    <AnnouncementItem
                      key={a.id}
                      announcement={a}
                      currentEmployee={currentEmployee}
                      onDelete={() =>
                        deleteAnnouncement.mutate(a.id, {
                          onSuccess: () =>
                            toast.success("Announcement deleted"),
                        })
                      }
                      onPin={() =>
                        pinAnnouncement.mutate(
                          { id: a.id, pinned: !a.pinned },
                          {
                            onSuccess: () =>
                              toast.success(a.pinned ? "Unpinned" : "Pinned"),
                          }
                        )
                      }
                    />
                  ))
                )}
              </div>
            </ScrollArea>{" "}
          </div>

          {announcements.length > 0 && (
            <div className="border-t bg-muted/10 p-2 text-center">
              <button
                onClick={() => toast.info("Archive feature coming soon")}
                className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:text-primary"
              >
                View History
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <PostAnnouncementDialog
        open={postOpen}
        onClose={() => setPostOpen(false)}
        currentEmployee={currentEmployee}
        onCreate={async (payload: PostPayload) => {
          await createAnnouncement.mutateAsync(payload)
          toast.success("Announcement posted")
          setPostOpen(false)
        }}
        isPending={createAnnouncement.isPending}
      />
    </>
  )
}

function AnnouncementItem({
  announcement: a,
  currentEmployee,
  onDelete,
  onPin,
}: any) {
  const author = a.author
  const canDelete =
    a.posted_by === currentEmployee.id || currentEmployee.role === "admin"
  const canPin =
    a.posted_by === currentEmployee.id || currentEmployee.role === "admin"

  return (
    <div
      className={`flex items-start gap-3 p-4 transition-colors ${a.pinned ? "bg-primary/[0.03]" : "hover:bg-muted/30"}`}
    >
      <Avatar className="mt-0.5 h-8 w-8 shrink-0 border">
        <AvatarImage src={author?.avatar_url ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {author?.first_name?.[0]}
          {author?.last_name?.[0]}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {a.pinned && (
            <Pin
              className="h-3 w-3 shrink-0 text-primary"
              fill="currentColor"
            />
          )}
          <p className="text-sm leading-none font-medium">{a.title}</p>
          <Badge
            variant="outline"
            className={`gap-1 text-[10px] font-medium capitalize ${a.target === "all" ? BADGE_STYLE.all : BADGE_STYLE.team}`}
          >
            {a.target === "all" ? (
              <Globe className="h-2.5 w-2.5" />
            ) : (
              <Users className="h-2.5 w-2.5" />
            )}
            {a.target === "all" ? "Company" : "Team"}
          </Badge>
        </div>
        <p className="text-xs leading-normal text-muted-foreground">{a.body}</p>
        <p className="pt-0.5 text-[10px] text-muted-foreground">
          {author?.first_name} {author?.last_name} ·{" "}
          {format(new Date(a.created_at), "MMM d 'at' h:mm a")}
        </p>
      </div>

      {(canPin || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {canPin && (
              <DropdownMenuItem onClick={onPin}>
                {a.pinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" /> Unpin
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" /> Pin to top
                  </>
                )}
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

function PostAnnouncementDialog({
  open,
  onClose,
  currentEmployee,
  onCreate,
  isPending,
}: any) {
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
    if (!title.trim() || !body.trim())
      return toast.error("Required fields missing")
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
          <DialogTitle>Post Announcement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
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
                  <SelectItem value="all">Everyone in the company</SelectItem>
                  <SelectItem value="employer_team">My team only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Megaphone className="mr-2 h-4 w-4" />
            )}
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
