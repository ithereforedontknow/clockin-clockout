import { useState } from "react"
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
  Globe,
  ChevronDown,
  ChevronUp,
  UserCircle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { Employee } from "@/lib/supabase"
import { toTimeManila } from "@/lib/timezone"
import { useTodayClockEntry } from "@/lib/queries"

const ROLE_STYLE: Record<string, string> = {
  employee: "border-slate-200 bg-slate-50 text-slate-600",
  employer: "border-blue-200 bg-blue-50 text-blue-700",
  admin: "border-purple-200 bg-purple-50 text-purple-700",
}

export function EmployeeProfileSheet({
  employee: emp,
  onClose,
}: {
  employee: Employee | null
  onClose: () => void
}) {
  const { data: clockEntry } = useTodayClockEntry(emp?.id ?? "")
  const [showMore, setShowMore] = useState(false)

  if (!emp) return null

  const isClockedIn = !!clockEntry && !clockEntry.clock_out
  const isOnBreak =
    isClockedIn && (clockEntry.breaks ?? []).some((b: any) => !b.break_end)

  return (
    <>
      <div
        className="fixed inset-[-1px] z-40 animate-in bg-black/20 backdrop-blur-sm fade-in-0"
        onClick={onClose}
        style={{ height: "100dvh" }}
      />

      <div className="fixed top-0 right-0 z-50 flex h-full w-full animate-in flex-col border-l bg-card shadow-2xl duration-300 slide-in-from-right sm:max-w-md">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-6 py-4">
          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Member Profile
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-8 p-6">
            {/* Identity Section */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                <AvatarImage src={emp.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/5 text-lg font-bold text-primary">
                  {emp.first_name[0]}
                  {emp.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold tracking-tight">
                  {emp.preferred_name || emp.first_name} {emp.last_name}
                </h2>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-bold uppercase ${ROLE_STYLE[emp.role]}`}
                  >
                    {emp.role}
                  </Badge>
                  <div
                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${
                      isClockedIn
                        ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`h-1 w-1 rounded-full ${isOnBreak ? "bg-amber-400" : isClockedIn ? "animate-pulse bg-emerald-500" : "bg-slate-300"}`}
                    />
                    {isOnBreak ? "Break" : isClockedIn ? "Live" : "Offline"}
                  </div>
                </div>
              </div>
            </div>

            {/* Essential Section 1: Work */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Professional Details
                </p>
                <Separator className="flex-1 opacity-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={Briefcase}
                  label="Position"
                  value={emp.job_title || "Team Member"}
                />
                <InfoItem
                  icon={Shield}
                  label="Department"
                  value={emp.department}
                />
                <InfoItem
                  icon={Globe}
                  label="Location"
                  value={emp.location || "Remote"}
                />
                <InfoItem
                  icon={AlarmClock}
                  label="Daily Goal"
                  value={`${emp.standard_hours_per_day}h`}
                />
              </div>
            </div>

            {/* Essential Section 2: Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Contact Information
                </p>
                <Separator className="flex-1 opacity-50" />
              </div>
              <div className="space-y-4">
                <InfoItem
                  icon={Mail}
                  label="Work Email"
                  value={emp.email}
                  isCopyable
                />
                <InfoItem
                  icon={Phone}
                  label="Primary Phone"
                  value={emp.phone}
                />
              </div>
            </div>

            {/* The "Show More" Toggle */}
            <div className="pt-2">
              {!showMore ? (
                <Button
                  variant="ghost"
                  className="h-9 w-full gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase hover:bg-primary/5 hover:text-primary"
                  onClick={() => setShowMore(true)}
                >
                  <ChevronDown className="h-3 w-3" />
                  View Additional Details
                </Button>
              ) : (
                <div className="animate-in space-y-8 duration-300 fade-in slide-in-from-top-2">
                  {/* Personal/Emergency Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                        Emergency Support
                      </p>
                      <Separator className="flex-1 opacity-50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem
                        icon={Heart}
                        label="Name"
                        value={emp.emergency_name}
                      />
                      <InfoItem
                        icon={Phone}
                        label="Phone"
                        value={emp.emergency_phone}
                      />
                    </div>
                    <InfoItem
                      icon={UserCircle}
                      label="Relationship"
                      value={emp.emergency_relation}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                        Other Info
                      </p>
                      <Separator className="flex-1 opacity-50" />
                    </div>
                    <div className="space-y-4">
                      <InfoItem
                        icon={MapPin}
                        label="Full Address"
                        value={[emp.address_line1, emp.city, emp.country]
                          .filter(Boolean)
                          .join(", ")}
                      />
                      <InfoItem
                        icon={Calendar}
                        label="Birthday"
                        value={
                          emp.birthday
                            ? format(new Date(emp.birthday), "MMMM do")
                            : null
                        }
                      />
                      <InfoItem
                        icon={Calendar}
                        label="Joining Date"
                        value={
                          emp.hire_date
                            ? format(new Date(emp.hire_date), "MMMM do, yyyy")
                            : null
                        }
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    className="h-9 w-full gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase hover:text-primary"
                    onClick={() => setShowMore(false)}
                  >
                    <ChevronUp className="h-3 w-3" />
                    Show Less
                  </Button>
                </div>
              )}
            </div>

            {/* Live shift highlight if they are in */}
            {isClockedIn && clockEntry && (
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <div>
                  <p className="text-[9px] font-bold tracking-tighter text-emerald-700 uppercase">
                    Current Shift
                  </p>
                  <p className="text-xs font-semibold text-emerald-900">
                    Started at {toTimeManila(clockEntry.clock_in)}
                  </p>
                </div>
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}

function InfoItem({ icon: Icon, label, value, isCopyable }: any) {
  if (!value) return null
  return (
    <div className="group flex items-start gap-3">
      <div className="mt-0.5 rounded-md bg-muted/50 p-1.5 text-muted-foreground transition-colors group-hover:bg-primary/5 group-hover:text-primary">
        <Icon className="h-3 w-3" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold tracking-tight text-muted-foreground/60 uppercase">
          {label}
        </p>
        <p
          className={`truncate text-xs font-semibold tabular-nums ${isCopyable ? "cursor-pointer text-primary hover:underline" : "text-foreground/90"}`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
