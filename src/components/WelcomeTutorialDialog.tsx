import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import {
  Clock,
  Timer,
  CalendarDays,
  User,
  Bell,
  CheckCircle2,
} from "lucide-react"
import { useUpdateEmployee } from "@/lib/queries"
import { toast } from "sonner"

interface Props {
  open: boolean
  onClose: () => void
  employeeId: string
}

export function WelcomeTutorialDialog({ open, onClose, employeeId }: Props) {
  const [step, setStep] = useState(0)
  const updateEmployee = useUpdateEmployee()

  const steps = [
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "Welcome to ClockIn/Out! 👋",
      content:
        "A simple and modern time tracking system. No passwords — just your work email.",
    },
    {
      icon: <Timer className="h-10 w-10 text-primary" />,
      title: "Clock In & Out",
      content:
        "Use the big button on the Home or Timesheet tab. You can also start/end breaks while clocked in.",
    },
    {
      icon: <CalendarDays className="h-10 w-10 text-primary" />,
      title: "Request Time Off",
      content:
        "Go to Time Off tab → Request Time Off. Your manager will review it quickly.",
    },
    {
      icon: <User className="h-10 w-10 text-primary" />,
      title: "Complete Your Profile",
      content:
        "Fill in your details in the My Info tab. Some fields require manager approval.",
    },
    {
      icon: <Bell className="h-10 w-10 text-primary" />,
      title: "Notifications",
      content:
        "Important updates (approvals, corrections, new team members) appear in the top-right bell.",
    },
    {
      icon: <CheckCircle2 className="h-10 w-10 text-green-600" />,
      title: "You're all set!",
      content: "You can always reopen this guide from the Help Center.",
    },
  ]

  const current = steps[step]

  async function finishTutorial() {
    if (employeeId) {
      await updateEmployee.mutateAsync({
        id: employeeId,
        updates: { onboarding_completed: true },
      })
    }
    toast.success("Welcome aboard! 🎉", {
      description: "You can always access the guide from Help → Tutorial",
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            {current.icon}
          </div>
          <DialogTitle className="text-center text-xl">
            {current.title}
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6 text-center text-sm leading-relaxed text-muted-foreground">
            {current.content}
          </CardContent>
        </Card>

        {/* Progress */}
        <div className="mt-6 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-all ${
                i === step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>
            Skip
          </Button>

          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}

            {step < steps.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            ) : (
              <Button onClick={finishTutorial}>Finish Tour</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
