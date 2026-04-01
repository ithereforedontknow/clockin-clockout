import { format } from "date-fns"
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  Heart,
  AlarmClock,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Employee } from "@/lib/supabase"
import { toTimeManila } from "@/lib/timezone"
import { useTodayClockEntry } from "@/lib/queries"

const ROLE_STYLE: Record<string, string> = {
  employee: "bg-slate-100 text-slate-700",
  employer: "bg-blue-50 text-blue-700",
  admin: "bg-purple-50 text-purple-700",
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  inactive: "bg-red-50 text-red-700",
  on_leave: "bg-amber-50 text-amber-700",
}

interface Props {
  employee: Employee | null
  onClose: () => void
}

export function EmployeeProfileSheet({ employee: emp, onClose }: Props) {
  const { data: clockEntry } = useTodayClockEntry(emp?.id ?? "")

  if (!emp) return null

  const initials = `${emp.first_name[0]}${emp.last_name[0]}`
  const isClockedIn = !!clockEntry && !clockEntry.clock_out
  const isOnBreak =
    isClockedIn && (clockEntry.breaks ?? []).some((b: any) => !b.break_end)

  const clockStatus = isOnBreak
    ? "On Break"
    : isClockedIn
      ? "Clocked In"
      : clockEntry?.clock_out
        ? "Clocked Out"
        : "Not Started"

  const clockColor = isOnBreak
    ? "bg-amber-50 text-amber-700"
    : isClockedIn
      ? "bg-green-50 text-green-700"
      : "bg-muted text-muted-foreground"

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 h-screen animate-in bg-black/10 fade-in-0"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-sm animate-in flex-col border-l border-border bg-background shadow-xl fade-in-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="font-semibold">Employee Profile</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-5 p-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={emp.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg leading-tight font-bold">
                  {emp.preferred_name ?? emp.first_name} {emp.last_name}
                </h2>
                {emp.preferred_name && (
                  <p className="text-xs text-muted-foreground">
                    {emp.first_name} {emp.last_name}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge
                    variant="secondary"
                    className={`text-xs capitalize ${ROLE_STYLE[emp.role]}`}
                  >
                    {emp.role}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`text-xs capitalize ${STATUS_STYLE[emp.employment_status]}`}
                  >
                    {emp.employment_status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Today's clock status */}
            <div
              className={`flex items-center gap-2.5 rounded-lg px-4 py-3 ${clockColor}`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  isClockedIn && !isOnBreak
                    ? "animate-pulse bg-green-500"
                    : isOnBreak
                      ? "bg-amber-400"
                      : "bg-muted-foreground"
                }`}
              />
              <span className="text-sm font-medium">{clockStatus}</span>
              {isClockedIn && clockEntry && (
                <span className="ml-auto text-xs opacity-75">
                  since {toTimeManila(clockEntry.clock_in)}
                </span>
              )}
            </div>

            <Separator />

            {/* Work info */}
            <Section title="Work">
              <InfoRow
                icon={Briefcase}
                label="Title"
                value={emp.job_title || "—"}
              />
              <InfoRow
                icon={Shield}
                label="Department"
                value={emp.department || "—"}
              />
              <InfoRow
                icon={MapPin}
                label="Location"
                value={emp.location || "—"}
              />
              <InfoRow
                icon={AlarmClock}
                label="Hours"
                value={`${emp.standard_hours_per_day}h/day · ${emp.standard_hours_per_week}h/week`}
              />
              <InfoRow
                icon={Calendar}
                label="Hired"
                value={
                  emp.hire_date
                    ? format(new Date(emp.hire_date), "MMMM d, yyyy")
                    : "—"
                }
              />
            </Section>

            <Separator />

            {/* Contact */}
            <Section title="Contact">
              <InfoRow icon={Mail} label="Email" value={emp.email} />
              <InfoRow icon={Phone} label="Phone" value={emp.phone || "—"} />
              {(emp.address_line1 || emp.city) && (
                <InfoRow
                  icon={MapPin}
                  label="Address"
                  value={[emp.address_line1, emp.city, emp.country]
                    .filter(Boolean)
                    .join(", ")}
                />
              )}
            </Section>

            {(emp.emergency_name || emp.emergency_phone) && (
              <>
                <Separator />
                <Section title="Emergency Contact">
                  <InfoRow
                    icon={Heart}
                    label="Name"
                    value={emp.emergency_name || "—"}
                  />
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={emp.emergency_phone || "—"}
                  />
                  <InfoRow
                    icon={Heart}
                    label="Relationship"
                    value={emp.emergency_relation || "—"}
                  />
                </Section>
              </>
            )}

            {emp.birthday && (
              <>
                <Separator />
                <Section title="Personal">
                  <InfoRow
                    icon={Calendar}
                    label="Birthday"
                    value={format(new Date(emp.birthday), "MMMM d")}
                  />
                </Section>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {title}
      </p>
      {children}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm break-words">{value}</p>
      </div>
    </div>
  )
}
