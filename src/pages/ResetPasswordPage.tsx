import { useState, useEffect, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react"
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

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false) // true once Supabase exchanges the code

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY after it exchanges the URL code
    // for a session. We wait for that before showing the form.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      toast.error("Passwords do not match")
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    setIsLoading(false)

    if (error) {
      toast.error("Failed to reset password", { description: error.message })
      return
    }

    toast.success("Password updated! Signing you in…")
    navigate("/", { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-xl bg-primary/10 p-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">New password</h1>
          <p className="text-sm text-muted-foreground">
            Choose a strong password for your account
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Set a new password</CardTitle>
            <CardDescription>Must be at least 8 characters.</CardDescription>
          </CardHeader>

          <CardContent>
            {!isReady ? (
              // Waiting for Supabase to exchange the recovery code
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setShowPass((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  {confirm && password !== confirm && (
                    <p className="text-xs text-destructive">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading || password !== confirm || password.length < 8
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    "Reset password"
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
