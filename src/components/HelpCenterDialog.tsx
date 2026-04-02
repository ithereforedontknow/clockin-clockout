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
import { Clock, HelpCircle, Mail } from "lucide-react"
import { WelcomeTutorialDialog } from "./WelcomeTutorialDialog"

interface Props {
  open: boolean
  onClose: () => void
  employeeId: string
}

export function HelpCenterDialog({ open, onClose, employeeId }: Props) {
  const [showTutorial, setShowTutorial] = useState(false)

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-[420px]">
          <DialogHeader className="pb-4">
            <div className="mb-2 flex justify-center">
              <HelpCircle className="h-9 w-9 text-primary" />
            </div>
            <DialogTitle className="text-center">Help Center</DialogTitle>
          </DialogHeader>

          <div className="-mr-1 flex-1 overflow-y-auto pr-1">
            <div className="space-y-5">
              {/* Quick Tutorial Button */}
              <Button
                variant="outline"
                className="h-12 w-full justify-start gap-3"
                onClick={() => setShowTutorial(true)}
              >
                <Clock className="h-5 w-5" />
                Watch Onboarding Tutorial
              </Button>

              {/* FAQs - Accordion (much more compact) */}
              <div>
                <p className="mb-3 text-xs tracking-widest text-muted-foreground uppercase">
                  Common Questions
                </p>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="clock">
                    <AccordionTrigger>How do I clock in/out?</AccordionTrigger>
                    <AccordionContent>
                      Use the big button on Home or Timesheet tab.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="timeoff">
                    <AccordionTrigger>
                      How do I request time off?
                    </AccordionTrigger>
                    <AccordionContent>
                      Go to Time Off tab → Request Time Off. Manager approval
                      required.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="profile">
                    <AccordionTrigger>
                      Why do some fields need approval?
                    </AccordionTrigger>
                    <AccordionContent>
                      Job title, department, and location changes need manager
                      review.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="notifications">
                    <AccordionTrigger>
                      How do notifications work?
                    </AccordionTrigger>
                    <AccordionContent>
                      Check the bell icon in the top right.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
            <div className="mt-auto border-t pt-4">
              {/* Contact HR */}
              <div className="flex gap-3 rounded-lg border p-4">
                <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Need more help?</p>
                  <p className="text-muted-foreground">
                    Contact your HR administrator for assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto border-t pt-4">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tutorial Modal */}
      <WelcomeTutorialDialog
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        employeeId={employeeId}
      />
    </>
  )
}
