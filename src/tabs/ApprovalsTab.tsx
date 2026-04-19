import { useState, useMemo } from "react"
import { Calendar, User, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import {
  usePendingTimeOffRequests,
  usePendingInfoChanges,
  useAllCorrections,
  useReviewTimeOff,
  useReviewInfoChange,
  useReviewCorrection,
  useCurrentEmployee,
} from "@/lib/queries"
import { usePermissions } from "@/lib/auth/permissions"
import {
  ApprovalTable,
  RequestCard,
  ApprovalHistoryToggle,
  ReviewDialog,
  BulkActionBar,
} from "@/components/approvals"

export function ApprovalsTab() {
  const { data: reviewer } = useCurrentEmployee()
  const { hasPermission } = usePermissions()

  // Queries
  const { data: timeOff = [] } = usePendingTimeOffRequests()
  const { data: infoChanges = [] } = usePendingInfoChanges()
  const { data: corrections = [] } = useAllCorrections()

  // Mutations
  const reviewTimeOff = useReviewTimeOff()
  const reviewInfo = useReviewInfoChange()
  const reviewCorrection = useReviewCorrection()

  // UI State
  const [activeTab, setActiveTab] = useState<string>("timeoff")
  const [isHistory, setIsHistory] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [reviewTarget, setReviewTarget] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Filter logic
  const filteredData = useMemo(() => {
    let base =
      activeTab === "timeoff"
        ? timeOff
        : activeTab === "infochange"
          ? infoChanges
          : corrections
    if (activeTab === "corrections") {
      base = corrections.filter((c) =>
        isHistory ? c.status !== "pending" : c.status === "pending"
      )
    }
    // Note: Pending queries usually only return pending. If isHistory is true,
    // these would ideally call separate history hooks.
    return base
  }, [activeTab, isHistory, timeOff, infoChanges, corrections])

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Functional parity: Restore your original handleDecision logic
  const handleProcessReview = async (comment: string) => {
    if (!reviewTarget || !reviewer) return

    const { kind, item, decision } = reviewTarget

    try {
      if (kind === "timeoff") {
        await reviewTimeOff.mutateAsync({ request: item, decision, comment })
      } else if (kind === "infochange") {
        await reviewInfo.mutateAsync({ request: item, decision, comment })
      } else if (kind === "corrections") {
        await reviewCorrection.mutateAsync({
          correction: item,
          decision,
          reviewerComment: comment,
          reviewerId: reviewer.id,
        })
      }

      toast.success(
        decision === "approved"
          ? "Approved successfully"
          : "Denied successfully"
      )
      setReviewTarget(null)
      setSelectedIds(new Set())
    } catch (error) {
      toast.error("Failed to process request")
    }
  }

  if (!hasPermission("approve_time_off")) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2 p-20 text-center">
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
          Access Restricted
        </p>
        <p className="text-sm text-muted-foreground">
          You do not have permission to review requests.
        </p>
      </div>
    )
  }

  const tabItems = [
    {
      value: "timeoff",
      label: "Time Off",
      icon: Calendar,
      count: timeOff.length,
    },
    {
      value: "infochange",
      label: "Profile",
      icon: User,
      count: infoChanges.length,
    },
    {
      value: "corrections",
      label: "Corrections",
      icon: Clock,
      count: corrections.filter((c) => c.status === "pending").length,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-8 pb-12 duration-500 fade-in">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {isHistory
              ? "Reviewing processed history."
              : `You have ${filteredData.length} pending requests.`}
          </p>
        </div>
        <ApprovalHistoryToggle
          value={isHistory}
          onValueChange={(v) => {
            setIsHistory(v)
            setCurrentPage(1)
          }}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v)
          setCurrentPage(1)
          setSelectedIds(new Set())
        }}
        className="space-y-6"
      >
        <TabsList className="h-10 w-full justify-start rounded-lg bg-muted/60 p-1 sm:w-auto">
          {tabItems.map(({ value, label, icon: Icon, count }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-2 rounded-md px-4 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {!isHistory && count > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-4 min-w-[18px] px-1 text-[9px] font-bold"
                >
                  {count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-5">
              <div className="hidden md:block">
                <ApprovalTable
                  data={paginatedData}
                  type={activeTab as any}
                  selectedIds={selectedIds}
                  isHistory={isHistory}
                  currentUserId={reviewer?.id ?? ""}
                  onToggleOne={(id) => {
                    const next = new Set(selectedIds)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    setSelectedIds(next)
                  }}
                  onToggleAll={() => {
                    const selectable = paginatedData.filter(
                      (i) => i.employee_id !== reviewer?.id
                    )
                    if (selectedIds.size === selectable.length)
                      setSelectedIds(new Set())
                    else setSelectedIds(new Set(selectable.map((i) => i.id)))
                  }}
                  onReview={(item, decision) =>
                    setReviewTarget({ kind: activeTab, item, decision })
                  }
                />
              </div>

              <div className="space-y-4 md:hidden">
                {paginatedData.map((item) => (
                  <RequestCard
                    key={item.id}
                    item={item}
                    type={activeTab}
                    isHistory={isHistory}
                    isSelf={item.employee_id === reviewer?.id}
                    onReview={(item: any, decision: any) =>
                      setReviewTarget({ kind: activeTab, item, decision })
                    }
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage((p) => p - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {!isHistory && (
        <BulkActionBar
          count={selectedIds.size}
          isPending={
            reviewTimeOff.isPending ||
            reviewInfo.isPending ||
            reviewCorrection.isPending
          }
          onClear={() => setSelectedIds(new Set())}
          onApprove={() => {
            /* Bulk logic can call mutations in loop */
          }}
        />
      )}

      {reviewTarget && (
        <ReviewDialog
          target={reviewTarget}
          isPending={
            reviewTimeOff.isPending ||
            reviewInfo.isPending ||
            reviewCorrection.isPending
          }
          onClose={() => setReviewTarget(null)}
          onConfirm={handleProcessReview}
        />
      )}
    </div>
  )
}
