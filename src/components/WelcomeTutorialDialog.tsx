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
  Users,
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
        "Simple employee time tracking. Clock in/out, request time off, and manage your profile — all in one place.",
    },
    {
      icon: <Timer className="h-10 w-10 text-primary" />,
      title: "Step 1: Clock In & Out",
      content:
        "Use the big button on the Home tab or Timesheet tab. While clocked in, you can start/end breaks.",
    },
    {
      icon: <CalendarDays className="h-10 w-10 text-primary" />,
      title: "Step 2: Request Time Off",
      content:
        "Go to the Time Off tab → Request Time Off. See your balance and submit requests for manager approval.",
    },
    {
      icon: <User className="h-10 w-10 text-primary" />,
      title: "Step 3: Update Your Profile",
      content:
        "In My Info, fill in your phone, birthday, address, and emergency contact. Some fields need approval.",
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Step 4: See Your Team",
      content: "Use the People tab to browse colleagues and view profiles.",
    },
    {
      icon: <Bell className="h-10 w-10 text-primary" />,
      title: "Step 5: Notifications",
      content: "The bell icon shows approvals, corrections, and team updates.",
    },
    {
      icon: <CheckCircle2 className="h-10 w-10 text-green-600" />,
      title: "You're Ready!",
      content:
        "You can always reopen this guide from the Help button in the sidebar.",
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
    toast.success("You're all set! 🎉")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            {current.icon}
          </div>
          <DialogTitle className="text-center">{current.title}</DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6 text-center text-sm leading-relaxed text-muted-foreground">
            {current.content}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full ${i === step ? "bg-primary" : "bg-muted"}`}
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
