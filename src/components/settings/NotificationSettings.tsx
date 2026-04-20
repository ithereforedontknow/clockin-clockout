import { useState, useEffect } from "react"
import { Laptop, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { useCurrentEmployee, useUpdateNotificationPrefs } from "@/lib/queries"

export function NotificationSettings() {
  const { data: employee } = useCurrentEmployee()
  const updatePrefs = useUpdateNotificationPrefs()
  const [prefs, setPrefs] = useState<any>({})

  useEffect(() => {
    if (employee?.notification_prefs) setPrefs(employee.notification_prefs)
  }, [employee])

  const handleToggle = (key: string, val: boolean) => {
    const next = { ...prefs, [key]: val }
    setPrefs(next)
    updatePrefs.mutate({ employeeId: employee!.id, prefs: next })
    toast.success("Preferences updated")
  }

  return (
    <div className="animate-in space-y-10 duration-300 fade-in">
      <div className="space-y-6">
        <SectionHead label="Operational Alerts" icon={Laptop} />
        <div className="space-y-1">
          <NotifRow
            label="Time off decisions"
            desc="Leave approvals and denials."
            active={!!prefs.timeoff_updates}
            onToggle={(v: boolean) => handleToggle("timeoff_updates", v)}
          />
          <NotifRow
            label="Profile changes"
            desc="When personal data updates are processed."
            active={!!prefs.profile_updates}
            onToggle={(v: boolean) => handleToggle("profile_updates", v)}
          />
          <NotifRow
            label="Clock corrections"
            desc="Manual shift adjustment results."
            active={!!prefs.correction_updates}
            onToggle={(v: boolean) => handleToggle("correction_updates", v)}
          />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHead label="Training & Compliance" icon={GraduationCap} />
        <div className="space-y-1">
          <NotifRow
            label="Curriculum assigned"
            desc="New course path requirements."
            active={!!prefs.course_assigned}
            onToggle={(v: boolean) => handleToggle("course_assigned", v)}
          />
          <NotifRow
            label="Certification results"
            desc="Path completion and verification."
            active={!!prefs.course_completed}
            onToggle={(v: boolean) => handleToggle("course_completed", v)}
          />
        </div>
      </div>
    </div>
  )
}

function SectionHead({ label, icon: Icon }: any) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[10px] font-black tracking-[0.25em] text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  )
}

function NotifRow({ label, desc, active, onToggle }: any) {
  return (
    <div className="group flex items-center justify-between rounded-2xl border border-transparent p-4 transition-colors hover:border-border/50 hover:bg-muted/50">
      <div className="space-y-0.5">
        <p className="text-sm font-bold tracking-tight">{label}</p>
        <p className="text-[11px] font-medium text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={active} onCheckedChange={onToggle} />
    </div>
  )
}
