import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Clock,
  Timer,
  CalendarDays,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { useUpdateEmployee } from "@/lib/queries"
import { toast } from "sonner"

const STEPS = [
  {
    icon: <Clock className="h-8 w-8 text-primary" />,
    title: "Welcome to Staffolio",
    content:
      "Your unified workspace for time tracking, leave management, and professional growth.",
  },
  {
    icon: <Timer className="h-8 w-8 text-primary" />,
    title: "Precision Timekeeping",
    content:
      "Clock in and out with a single tap. The system automatically tracks your active hours and breaks.",
  },
  {
    icon: <CalendarDays className="h-8 w-8 text-primary" />,
    title: "Leave Management",
    content:
      "Submit time-off requests and track your available balances across all leave categories.",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Team Connectivity",
    content:
      "Access the Staff Directory to find teammates and view real-time presence indicators.",
  },
  {
    icon: <CheckCircle2 className="h-8 w-8 text-emerald-600" />,
    title: "Ready for Launch",
    content:
      "Your environment is configured. You can access this guide anytime via the Help Center.",
  },
]

export function WelcomeTutorialDialog({
  open,
  onClose,
  employeeId,
}: {
  open: boolean
  onClose: () => void
  employeeId: string
}) {
  const [step, setStep] = useState(0)
  const updateEmployee = useUpdateEmployee()
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const handleFinish = async () => {
    if (employeeId) {
      await updateEmployee.mutateAsync({
        id: employeeId,
        updates: { onboarding_completed: true },
      })
    }
    toast.success("Welcome aboard! 🎉")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[420px]">
        <div className="space-y-6 p-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
              {current.icon}
            </div>
            <div className="h-[100px] space-y-2">
              {" "}
              {/* Fixed height prevents modal resizing */}
              <DialogTitle className="text-xl font-bold tracking-tight">
                {current.title}
              </DialogTitle>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {current.content}
              </p>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : "w-2 bg-muted"}`}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t bg-muted/30 p-6 sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold tracking-widest text-muted-foreground uppercase"
          >
            Skip
          </Button>

          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                className="h-9 w-9 rounded-full p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {!isLast ? (
              <Button
                size="sm"
                onClick={() => setStep((s) => s + 1)}
                className="h-9 px-6 font-bold shadow-sm"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinish}
                className="h-9 bg-emerald-600 px-6 font-bold shadow-md hover:bg-emerald-700"
              >
                Get Started
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
