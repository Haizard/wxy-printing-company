import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, MoreHorizontal, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useJobs } from "@/hooks/useApi";

type JobStatus = "confirmed" | "in_production" | "qa" | "ready" | "delivered";

const columns: { status: JobStatus; label: string; color: string }[] = [
  { status: "confirmed", label: "Confirmed", color: "text-[var(--accent-tertiary)]" },
  { status: "in_production", label: "In Production", color: "text-[var(--accent-warning)]" },
  { status: "qa", label: "QA", color: "text-[var(--accent-primary)]" },
  { status: "ready", label: "Ready", color: "text-[var(--accent-success)]" },
  { status: "delivered", label: "Delivered", color: "text-[var(--text-tertiary)]" },
];

const priorityColors: Record<string, "danger" | "warning" | "default" | "secondary"> = {
  urgent: "danger",
  high: "warning",
  normal: "default",
  low: "secondary",
};

function JobCard({ job }: { job: any }) {
  return (
    <Card className="cursor-pointer hover:shadow-[var(--glass-shadow)] transition-all duration-200 hover:scale-[0.98]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-subhead font-semibold leading-tight">{job.title}</p>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-caption text-[var(--text-tertiary)] mb-3">{job.jobNumber}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-caption text-[var(--text-secondary)]">
              {job.assignedTo ? "Assigned" : "Unassigned"}
            </span>
          </div>
          <Badge variant={priorityColors[job.priority] || "default"} className="text-[10px] px-1.5 py-0">
            {job.priority}
          </Badge>
        </div>
        {job.dueDate && (
          <div className="flex items-center gap-1.5 mt-2">
            <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-caption text-[var(--text-tertiary)]">{job.dueDate}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const { data: jobs, loading } = useJobs();

  const allJobs = jobs || [];
  const filteredJobs = activeTab === "all" ? allJobs : allJobs.filter((j: any) => j.status === activeTab);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Jobs</h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Track and manage your production jobs
        </p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-3">
              {[1, 2].map((j) => (
                <div key={j} className="h-32 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Desktop: Horizontal scroll columns */}
          <div className="hidden lg:grid grid-cols-5 gap-4">
            {columns.map((col) => {
              const colJobs = allJobs.filter((j: any) => j.status === col.status);
              return (
                <div key={col.status}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className={`text-subhead font-semibold ${col.color}`}>{col.label}</h3>
                    <span className="text-caption text-[var(--text-tertiary)] bg-[var(--glass-fill-subtle)] px-2 py-0.5 rounded-pill">
                      {colJobs.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {colJobs.map((job: any) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                    {colJobs.length === 0 && (
                      <div className="text-center py-6 text-caption text-[var(--text-tertiary)]">
                        No jobs
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: Tabs */}
          <div className="lg:hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full overflow-x-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                {columns.map((col) => (
                  <TabsTrigger key={col.status} value={col.status}>
                    {col.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activeTab}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {filteredJobs.map((job: any) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
}
