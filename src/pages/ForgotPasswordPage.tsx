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
import { useCompanySettings } from "@/lib/queries"

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { data: settings } = useCompanySettings()

  const companyName = settings?.company_name ?? "Staffolio"
  const logoUrl = settings?.logo_url

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setIsLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setIsLoading(false)
    if (error) {
      toast.error("Reset failed", { description: error.message })
      return
    }
    setSent(true)
  }

  return (
    <div className="flex min-h-screen animate-in items-center justify-center bg-muted/30 p-6 duration-500 fade-in">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Branding Header */}
        <div className="mb-4 flex flex-col items-center gap-3 text-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyName}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <div className="rounded-2xl bg-primary/10 p-3">
              <AlarmClock className="h-7 w-7 text-primary" />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight">{companyName}</h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
              Security Recovery
            </p>
          </div>
        </div>

        <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-border">
          {!sent ? (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">
                  Reset Password
                </CardTitle>
                <CardDescription className="text-xs">
                  We'll send a temporary link to your email to authorize a
                  password change.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black tracking-widest text-muted-foreground/70 uppercase">
                      Work Email
                    </Label>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 font-medium"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-10 w-full font-bold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Send Reset Link
                  </Button>
                </form>
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-xs font-bold text-muted-foreground"
                  onClick={() => navigate("/login")}
                >
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </Button>
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
                  A verification link was sent to{" "}
                  <span className="font-bold text-foreground">{email}</span>.
                  Please click it to continue.
                </p>
              </div>
              <Button
                variant="outline"
                className="h-10 w-full font-bold"
                onClick={() => navigate("/login")}
              >
                Return to Login
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
