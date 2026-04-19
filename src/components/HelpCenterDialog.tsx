import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle, Mail, BookOpen } from "lucide-react"
import { WelcomeTutorialDialog } from "./WelcomeTutorialDialog"

interface Props {
  open: boolean
  onClose: () => void
  employeeId: string
}

const FAQS = [
  {
    value: "clock",
    q: "How do I clock in and out?",
    a: "Use the large button on the Home or Timesheet tab. You can also clock in from the command palette (⌘K).",
  },
  {
    value: "timeoff",
    q: "How do I request time off?",
    a: 'Go to the Time Off tab and click "Request Time Off". Your manager will be notified to review.',
  },
  {
    value: "profile",
    q: "Why do some changes need approval?",
    a: "Job title, department, and location changes go through a manager review before taking effect.",
  },
  {
    value: "notifications",
    q: "How do notifications work?",
    a: "In-app notifications appear in the bell icon. You can manage which events notify you in Settings.",
  },
]

export function HelpCenterDialog({ open, onClose, employeeId }: Props) {
  const [showTutorial, setShowTutorial] = useState(false)

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-[400px]">
          <DialogHeader className="shrink-0">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Help Center</DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto">
            {/* Tutorial */}
            <button
              className="flex w-full items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/60"
              onClick={() => setShowTutorial(true)}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Watch onboarding tutorial</p>
                <p className="text-xs text-muted-foreground">
                  A quick walkthrough of all features
                </p>
              </div>
            </button>

            {/* FAQs */}
            <div>
              <p className="mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Common Questions
              </p>
              <Accordion type="single" collapsible className="w-full">
                {FAQS.map(({ value, q, a }) => (
                  <AccordionItem key={value} value={value}>
                    <AccordionTrigger className="text-sm">{q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Contact */}
            <div className="flex gap-3 rounded-lg border bg-muted/20 p-4">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Need more help?</p>
                <p className="text-xs text-muted-foreground">
                  Contact your HR administrator for assistance.
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t pt-4">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WelcomeTutorialDialog
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        employeeId={employeeId}
      />
    </>
  )
}
