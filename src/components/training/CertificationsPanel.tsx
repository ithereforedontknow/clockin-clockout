import { format } from "date-fns"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { Award, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentEmployee, useMyCertifications } from "@/lib/queries"
import { CertificateDocument } from "@/components/training/CertificateDocument"

export function CertificationsPanel() {
  const { data: certs = [], isLoading } = useMyCertifications()
  const { data: employee } = useCurrentEmployee()

  if (!isLoading && certs.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        <Award className="h-4 w-4" />
        Certificates Earned
      </h3>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center gap-3 rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-yellow-50/50 p-4 dark:border-amber-900/30 dark:from-amber-900/10 dark:to-yellow-900/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {cert.curriculum?.title ?? "Course"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Issued {format(new Date(cert.issued_at), "MMM d, yyyy")}
                </p>
              </div>

              <PDFDownloadLink
                document={
                  <CertificateDocument
                    employeeName={`${employee?.first_name ?? ""} ${employee?.last_name ?? ""}`}
                    courseTitle={cert.curriculum?.title ?? "Course"}
                    completionDate={format(
                      new Date(cert.issued_at),
                      "MMMM d, yyyy"
                    )}
                  />
                }
                fileName={`certificate-${cert.curriculum?.title ?? "course"}.pdf`}
              >
                {({ loading }) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    className="shrink-0 gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {loading ? "…" : "PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
