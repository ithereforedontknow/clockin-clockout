import { useState, type FormEvent } from "react"
import { useLocation, Navigate, useNavigate } from "react-router-dom"
import { Loader2, AlarmClock, MailCheck, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/auth"
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
import { useCompanySettings } from "@/lib/queries"

type Stage = "form" | "sent"

export function LoginPage() {
  const location = useLocation()
  const { session, isLoading: sessionLoading } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [stage, setStage] = useState<Stage>("form")
  const { data: settings } = useCompanySettings()
  const companyName = settings?.company_name ?? "ClockIn/Out"
  const logoUrl = settings?.logo_url

  // Already logged in — send to the app
  if (!sessionLoading && session) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/"
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error("Please enter your work email")
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // After clicking the link, Supabase redirects here.
        // onAuthStateChange in useSession picks up the session automatically.
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    setIsLoading(false)

    if (error) {
      toast.error("Failed to send link", {
        description: error.message,
      })
      return
    }

    setStage("sent")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyName}
              className="h-16 w-auto max-w-[200px] object-contain"
            />
          ) : (
            <div className="rounded-2xl bg-primary/10 p-4">
              <AlarmClock className="h-8 w-8 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{companyName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Employee time tracking
            </p>
          </div>
        </div>

        <Card>
          {stage === "form" ? (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Sign in</CardTitle>
                <CardDescription>
                  Enter your work email and we'll send you a sign-in link. No
                  password needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending link…
                      </>
                    ) : (
                      "Send sign-in link"
                    )}
                  </Button>
                </form>
                <div className="text-center">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot your password?
                  </button>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Check your inbox</CardTitle>
                <CardDescription>
                  We sent a sign-in link to your email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Confirmation state */}
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <MailCheck className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Link sent to</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {email}
                    </p>
                  </div>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Click the link in the email to sign in. The link expires in
                    1 hour. Check your spam folder if you don't see it.
                  </p>
                </div>

                {/* Resend / back */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                    onClick={handleSubmit as any}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resending…
                      </>
                    ) : (
                      "Resend link"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => {
                      setStage("form")
                      setEmail("")
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Use a different email
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Having trouble? Contact your HR administrator.
        </p>
      </div>
    </div>
  )
}
