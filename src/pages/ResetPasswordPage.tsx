import { useState, useEffect, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Eye, EyeOff, ShieldCheck, AlarmClock } from "lucide-react"
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

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { data: settings } = useCompanySettings()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const companyName = settings?.company_name ?? "Stafffolio"
  const logoUrl = settings?.logo_url

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) return toast.error("Minimum 8 characters required")
    if (password !== confirm) return toast.error("Passwords do not match")

    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setIsLoading(false)

    if (error) {
      toast.error("Update failed", { description: error.message })
      return
    }

    toast.success("Password updated")
    navigate("/", { replace: true })
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
              Security Update
            </p>
          </div>
        </div>

        <Card className="border-none bg-card shadow-xl ring-1 shadow-slate-200/50 ring-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">New Password</CardTitle>
            <CardDescription className="text-xs">
              Set a strong password to secure your account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!isReady ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="animate-pulse text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Verifying Security Token...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black tracking-widest text-muted-foreground/70 uppercase">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 pr-10 font-bold tracking-widest"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black tracking-widest text-muted-foreground/70 uppercase">
                    Confirm Password
                  </Label>
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="h-10 font-bold tracking-widest"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full font-bold shadow-lg"
                  disabled={
                    isLoading || password !== confirm || password.length < 8
                  }
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Update Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
