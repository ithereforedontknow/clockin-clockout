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

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { session, isLoading: sessionLoading } = useSession()
  const { data: settings } = useCompanySettings()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [stage, setStage] = useState<"form" | "sent">("form")

  const companyName = settings?.company_name ?? "Stafffolio"
  const logoUrl = settings?.logo_url

  if (!sessionLoading && session) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/"
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return toast.error("Enter your work email")
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    setIsLoading(false)
    if (error)
      return toast.error("Failed to send link", { description: error.message })
    setStage("sent")
  }

  return (
    <div className="flex min-h-screen animate-in items-center justify-center bg-muted/30 p-6 duration-500 fade-in">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Consistent Branding Header */}
        <div className="mb-4 flex flex-col items-center gap-3 text-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyName}
              className="h-10 w-auto max-w-[180px] object-contain"
            />
          ) : (
            <div className="rounded-2xl bg-primary/10 p-3">
              <AlarmClock className="h-7 w-7 text-primary" />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight">{companyName}</h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
              Employee Portal
            </p>
          </div>
        </div>

        <Card className="border-none bg-card shadow-xl ring-1 shadow-slate-200/50 ring-border">
          {stage === "form" ? (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Sign In</CardTitle>
                <CardDescription className="text-xs">
                  Enter your work email to receive a secure access link.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black tracking-widest text-muted-foreground/70 uppercase">
                      Corporate Email
                    </Label>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 font-medium"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-10 w-full font-bold"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Magic Link
                  </Button>
                </form>
                <div className="text-center">
                  <button
                    onClick={() => navigate("/forgot-password")}
                    className="text-[11px] font-bold text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                  >
                    Trouble signing in?
                  </button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="space-y-6 pt-10 pb-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600">
                <MailCheck className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold">Check your inbox</p>
                <p className="px-4 text-xs leading-relaxed text-muted-foreground">
                  We've sent a secure sign-in link to{" "}
                  <span className="font-bold text-foreground">{email}</span>.
                </p>
              </div>
              <Button
                variant="ghost"
                className="w-full gap-2 text-xs font-bold text-muted-foreground hover:text-primary"
                onClick={() => setStage("form")}
              >
                <ArrowLeft className="h-4 w-4" /> Use different email
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
