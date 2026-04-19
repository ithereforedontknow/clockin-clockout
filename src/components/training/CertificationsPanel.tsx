import { format } from "date-fns"
import { Award, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentEmployee, useMyCertifications } from "@/lib/queries"

export function CertificationsPanel() {
  const { data: certs = [], isLoading } = useMyCertifications()
  const { data: employee } = useCurrentEmployee()

  if (!isLoading && certs.length === 0) return null

  const handlePrintCertificate = (cert: any) => {
    const printWindow = window.open("", "", "width=900,height=650")
    if (!printWindow) return

    const html = `
      <html>
        <head>
          <title>Certificate - ${cert.curriculum?.title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; text-align: center; color: #1e293b; }
            .border { border: 8px solid #0f172a; padding: 60px; height: calc(100vh - 120px); box-sizing: border-box; border-radius: 8px; position: relative; }
            h1 { font-size: 42px; margin-bottom: 40px; color: #0f172a; letter-spacing: -1px; }
            .name { font-size: 36px; font-weight: bold; margin: 30px 0; color: #2563eb; }
            .text { font-size: 20px; color: #475569; margin: 10px 0; }
            .course { font-size: 28px; font-weight: bold; margin: 20px 0; color: #0f172a; }
            .date { font-size: 16px; color: #64748b; margin-top: 40px; }
            .footer { position: absolute; bottom: 40px; left: 0; right: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="border">
            <h1>Certificate of Completion</h1>
            <div class="text">This certifies that</div>
            <div class="name">${employee?.first_name} ${employee?.last_name}</div>
            <div class="text">has successfully completed the curriculum</div>
            <div class="course">${cert.curriculum?.title}</div>
            <div class="date">Issued on ${format(new Date(cert.issued_at), "MMMM do, yyyy")}</div>
            <div class="footer">Verified by Learning Hub System</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
        <Award className="h-3.5 w-3.5 text-amber-500" />
        Earned Certifications
      </h3>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((cert: any) => (
            <div
              key={cert.id}
              className="group flex items-center gap-4 rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-white p-4 shadow-sm transition-all hover:border-amber-300/50 hover:shadow-md dark:border-amber-700/50 dark:from-amber-900/50 dark:to-gray-800 dark:hover:border-amber-600/50 dark:hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-inner dark:from-amber-500 dark:to-amber-700">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {cert.curriculum?.title ?? "Course"}
                </p>
                <p className="mt-0.5 text-[10px] font-bold tracking-tighter text-amber-700/70 uppercase dark:text-amber-500/70">
                  Issued {format(new Date(cert.issued_at), "MMM d, yyyy")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full text-amber-700 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-800 dark:hover:text-amber-300"
                onClick={() => handlePrintCertificate(cert)}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
