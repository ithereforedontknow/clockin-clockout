import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { HelpCircle, Clock, Bell, Keyboard, Mail } from "lucide-react"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-3 flex justify-center">
              <HelpCircle className="h-10 w-10 text-primary" />
            </div>
            <DialogTitle className="text-center">Help Center</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Card>
              <CardContent className="pt-5">
                <Button
                  variant="outline"
                  className="h-12 w-full justify-start gap-3"
                  onClick={() => setShowTutorial(true)}
                >
                  <Clock className="h-5 w-5" />
                  Re-watch Onboarding Tutorial
                </Button>
              </CardContent>
            </Card>

            <div>
              <p className="mb-2 text-xs tracking-widest text-muted-foreground uppercase">
                Quick Shortcuts
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Keyboard className="h-4 w-4" /> ⌘K
                  <span className="text-muted-foreground">Command Palette</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Bell className="h-4 w-4" /> Bell Icon
                  <span className="text-muted-foreground">Notifications</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Need help?</p>
                  <p className="text-muted-foreground">
                    Contact your HR administrator
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Tutorial re-opener */}
      <WelcomeTutorialDialog
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        employeeId={employeeId}
      />
    </>
  )
}
