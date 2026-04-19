import { Camera, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function IdentityCard({ user, uploading }: any) {
  return (
    <Card className="overflow-hidden border-none bg-muted/20 shadow-none">
      <CardContent className="flex flex-col items-center pt-10 pb-8 text-center">
        <div
          className="group relative cursor-pointer"
          onClick={() => document.getElementById("avatar-upload")?.click()}
        >
          <Avatar className="h-32 w-32 border-4 border-background shadow-2xl transition-transform group-hover:scale-[1.02]">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-3xl font-black text-primary">
              {user.first_name[0]}
              {user.last_name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-[2px] transition-all group-hover:opacity-100">
            <Camera className="mb-1 h-6 w-6" />
            <span className="text-[10px] font-bold tracking-tighter uppercase">
              Update Photo
            </span>
          </div>

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="mt-6 space-y-1">
          <h2 className="text-xl font-bold tracking-tight">
            {user.first_name} {user.last_name}
          </h2>
          <p className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
            {user.job_title || "Team Member"}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-[10px] font-bold text-blue-700 uppercase"
          >
            {user.role}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] font-bold uppercase ${user.employment_status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}
          >
            {user.employment_status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
