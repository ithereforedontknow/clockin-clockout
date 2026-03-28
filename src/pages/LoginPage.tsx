import { useState, type FormEvent } from "react"
import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { Loader2, AlarmClock, Eye, EyeOff } from "lucide-react"
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

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, isLoading: sessionLoading } = useSession()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (!sessionLoading && session) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/"
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password")
      return
    }
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      toast.error("Sign in failed", {
        description: error.message.includes("Invalid login")
          ? "Incorrect email or password."
          : error.message,
      })
      setIsLoading(false)
      return
    }
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/"
    navigate(from, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-2xl bg-primary/10 p-4">
            <AlarmClock className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ClockIn/Out</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Employee time tracking
            </p>
          </div>
        </div>

        {/* Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sign in</CardTitle>
            <CardDescription>
              Enter your work email and password to continue
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => navigate("/forgot-password")}
                    tabIndex={-1}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing
                    in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Having trouble? Contact your HR administrator.
        </p>
      </div>
    </div>
  )
}
