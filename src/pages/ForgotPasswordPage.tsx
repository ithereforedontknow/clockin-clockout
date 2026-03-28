import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, ArrowLeft, MailCheck, AlarmClock } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setIsLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setIsLoading(false)
    if (error) {
      toast.error("Failed to send reset email", { description: error.message })
      return
    }
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-2xl bg-primary/10 p-4">
            <AlarmClock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ClockIn/Out</h1>
        </div>

        <button
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => navigate("/login")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reset your password</CardTitle>
            <CardDescription>
              Enter your work email and we'll send a reset link valid for 24
              hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <MailCheck className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium">Check your inbox</p>
                <p className="text-sm text-muted-foreground">
                  We sent a reset link to{" "}
                  <span className="font-medium text-foreground">{email}</span>.
                </p>
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => navigate("/login")}
                >
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
