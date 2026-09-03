import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Clock, User, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, FileText, Upload, X, History, Trash2, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useJobs } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import { compressImageFile, readFileAsBase64 } from "@/lib/image-utils";

type JobStatus = "confirmed" | "in_production" | "qa" | "ready" | "delivered";

const columns: { status: JobStatus; label: string; color: string; next?: JobStatus; prev?: JobStatus }[] = [
  { status: "confirmed", label: "Confirmed", color: "text-[var(--accent-tertiary)]", next: "in_production" },
  { status: "in_production", label: "In Production", color: "text-[var(--accent-warning)]", next: "qa", prev: "confirmed" },
  { status: "qa", label: "QA", color: "text-[var(--accent-primary)]", next: "ready", prev: "in_production" },
  { status: "ready", label: "Ready", color: "text-[var(--accent-success)]", next: "delivered", prev: "qa" },
  { status: "delivered", label: "Delivered", color: "text-[var(--text-tertiary)]", prev: "ready" },
];

const priorityColors: Record<string, "danger" | "warning" | "default" | "secondary"> = {
  urgent: "danger",
  high: "warning",
  normal: "default",
  low: "secondary",
};

function JobDetailPanel({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const [job, setJob] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const role = user?.role;
  const canManage = role === "admin" || role === "sales";

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem("printhub_token");
        const res = await fetch(`/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setJob(data);
          setHistory(data.history || []);
        }
      } catch {
        console.error("Failed to fetch job");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      const token = localStorage.getItem("printhub_token");
      const col = columns.find((c) => c.status === job.status);
      const res = await fetch(`/api/jobs/${jobId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: job.status, note }),
      });
      if (res.ok) {
        setHistory((prev) => [...prev, {
          id: Date.now().toString(),
          fromStatus: job.status,
          toStatus: job.status,
          note,
          changedAt: new Date().toISOString(),
        }]);
        setNote("");
        toast({ title: "Note added", variant: "success" });
      }
    } catch {
      toast({ title: "Failed to add note", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <div className="h-6 w-48 rounded bg-[var(--glass-fill-subtle)] animate-pulse" />
          <div className="h-4 w-32 rounded bg-[var(--glass-fill-subtle)] animate-pulse" />
          <div className="h-20 rounded bg-[var(--glass-fill-subtle)] animate-pulse" />
        </div>
      </Card>
    );
  }

  if (!job) return null;

  return (
    <Card className="overflow-hidden">        <div className="flex items-center justify-between p-4 border-b border-[rgba(60,60,67,0.15)]">
        <div>
          <h3 className="text-headline font-semibold">{job.jobNumber}</h3>
          <p className="text-subhead text-[var(--text-secondary)]">{job.title}</p>
        </div>
        <div className="flex items-center gap-1">
          {canManage && (
            <Button variant="ghost" size="icon" className="text-[var(--text-tertiary)] hover:text-red-500" onClick={() => {
              if (!confirm("Delete this job?")) return;
              fetch(`/api/jobs/${jobId}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("printhub_token")}` } }).then(r => { if (r.ok) { onClose(); window.location.reload(); } });
            }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Job info */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-card-subtle p-3 rounded-[var(--radius-md)]">
            <p className="text-caption text-[var(--text-tertiary)]">Status</p>
            <Badge variant="default" className="mt-1">{job.status?.replace(/_/g, " ")}</Badge>
          </div>
          <div className="glass-card-subtle p-3 rounded-[var(--radius-md)]">
            <p className="text-caption text-[var(--text-tertiary)]">Priority</p>
            <Badge variant={priorityColors[job.priority] || "default"} className="mt-1">{job.priority}</Badge>
          </div>
          {job.dueDate && (
            <div className="glass-card-subtle p-3 rounded-[var(--radius-md)]">
              <p className="text-caption text-[var(--text-tertiary)]">Due Date</p>
              <p className="text-subhead font-medium mt-1">{job.dueDate}</p>
            </div>
          )}
          {job.assignedTo && (
            <div className="glass-card-subtle p-3 rounded-[var(--radius-md)]">
              <p className="text-caption text-[var(--text-tertiary)]">Assigned To</p>
              <p className="text-subhead font-medium mt-1">{job.assignedTo}</p>
            </div>
          )}
        </div>

        {/* File uploads */}
        <div className="glass-card-subtle p-4 rounded-[var(--radius-md)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-subhead font-semibold">Artwork & Files</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.ai,.eps,.psd,.cdr"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                setUploading(true);
                try {
                  if (file.size > 60 * 1024 * 1024) {
                    toast({
                      title: "File too large",
                      description: "Please upload a file smaller than ~40 MB.",
                      variant: "destructive",
                    });
                    return;
                  }
                  // Compress images client-side so artwork photos don't blow
                  // the server body limit (previously failed with 413); other
                  // formats (PDF/AI/EPS/PSD/CDR) are sent as-is.
                  const isImage = file.type.startsWith("image/");
                  const base64 = isImage
                    ? await compressImageFile(file)
                    : await readFileAsBase64(file);

                  if (!base64) {
                    toast({
                      title: "Could not read file",
                      description: "The file format is unsupported or the file is unreadable.",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (base64.length > 55 * 1024 * 1024) {
                    toast({
                      title: "File too large",
                      description: "Please upload a file smaller than ~40 MB.",
                      variant: "destructive",
                    });
                    return;
                  }

                  const token = localStorage.getItem("printhub_token");
                  const res = await fetch(`/api/jobs/${jobId}/files`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      fileUrl: base64,
                      fileType: "artwork",
                    }),
                  });
                  if (res.ok) {
                    const newFile = await res.json();
                    setJob((prev: any) => ({
                      ...prev,
                      files: [...(prev.files || []), newFile],
                    }));
                    toast({ title: "File uploaded", description: file.name });
                  } else {
                    let detail: string | undefined;
                    try {
                      const body = await res.json();
                      if (body?.error) detail = body.error;
                    } catch {
                      // non-JSON error body — keep generic message
                    }
                    toast({
                      title:
                        res.status === 413
                          ? "File too large for server"
                          : "Upload failed",
                      description:
                        detail ||
                        (res.status === 413
                          ? "The server rejected this file. Try a smaller version or a compressed PDF."
                          : undefined),
                      variant: "destructive",
                    });
                  }
                } catch (err) {
                  toast({
                    title: "Upload failed",
                    description:
                      err instanceof Error
                        ? err.message
                        : "Something went wrong while uploading the file.",
                    variant: "destructive",
                  });
                } finally {
                  setUploading(false);
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3 h-3 mr-1" /> {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
          {job?.files?.length > 0 ? (
            <div className="space-y-2">
              {job.files.map((f: any) => (
                <div key={f.id} className="flex items-center gap-2 p-2 rounded bg-white/30">
                  <FileText className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-caption flex-1 truncate">{f.fileType || "file"}</span>
                  <span className="text-caption text-[var(--text-tertiary)]">
                    {new Date(f.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <FileText className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
              <p className="text-caption text-[var(--text-tertiary)]">
                No files uploaded yet
              </p>
            </div>
          )}
        </div>

        {/* Status history timeline */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-[var(--text-secondary)]" />
            <p className="text-subhead font-semibold">Status History</p>
          </div>
          {history.length === 0 ? (
            <p className="text-caption text-[var(--text-tertiary)]">No status changes yet</p>
          ) : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={h.id || i} className="flex items-start gap-3 p-2 rounded-[var(--radius-md)] hover:bg-[var(--glass-fill-subtle)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {h.fromStatus && h.fromStatus !== h.toStatus && (
                        <span className="text-caption text-[var(--text-tertiary)]">
                          {h.fromStatus?.replace(/_/g, " ")} →
                        </span>
                      )}
                      <Badge variant="secondary" className="text-[10px]">{h.toStatus?.replace(/_/g, " ")}</Badge>
                      {h.changedAt && (
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          {new Date(h.changedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {h.note && (
                      <p className="text-caption text-[var(--text-secondary)] mt-0.5">{h.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add note */}
        <div className="flex gap-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            placeholder="Add a note..."
            className="flex-1"
          />
          <Button size="sm" onClick={handleAddNote} disabled={!note.trim()}>
            Add Note
          </Button>
        </div>
      </div>
    </Card>
  );
}

function JobCard({ job, onMove, onExpand, onDelete, userRole }: { job: any; onMove: (id: string, status: string) => void; onExpand: (id: string) => void; onDelete: (id: string) => void; userRole?: string }) {
  const col = columns.find((c) => c.status === job.status);
  const canManageJob = userRole === "admin" || userRole === "sales";
  const canAdvanceOnly = userRole === "production";
  return (
    <Card className="cursor-pointer hover:shadow-[var(--glass-shadow)] transition-all duration-200 hover:scale-[0.98]">
      <CardContent className="p-4">
        <div
          className="flex items-start justify-between gap-2 mb-3"
          onClick={() => onExpand(job.id)}
        >
          <div className="flex-1 min-w-0">
            <p className="text-subhead font-semibold leading-tight truncate">{job.title}</p>
            <p className="text-caption text-[var(--text-tertiary)]">{job.jobNumber}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={priorityColors[job.priority] || "default"} className="text-[10px] px-1.5 py-0">
              {job.priority}
            </Badge>
            {canManageJob && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
                className="text-[var(--text-tertiary)] hover:text-red-500 p-0.5"
                title="Delete job"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
          </div>
        </div>

        {job.dueDate && (
          <div className="flex items-center gap-1.5 mb-3">
            <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-caption text-[var(--text-tertiary)]">{job.dueDate}</span>
          </div>
        )}

        {/* Status movement buttons */}
        {(canManageJob || canAdvanceOnly) && (
          <div className="flex items-center gap-2 pt-2 border-t border-[rgba(60,60,67,0.15)]">
            {col?.prev && canManageJob && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); onMove(job.id, col.prev!); }}
                className="flex-1 text-[10px] h-7"
              >
                <ChevronLeft className="w-3 h-3 mr-1" />
                {columns.find((c) => c.status === col.prev)?.label}
              </Button>
            )}
            {col?.next && (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); onMove(job.id, col.next!); }}
                className="flex-1 text-[10px] h-7"
              >
                {columns.find((c) => c.status === col.next)?.label}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const { data: jobs, loading, refetch } = useJobs();
  const { toast } = useToast();
  const { user } = useAuth();
  const role = user?.role;
  const canCreateDelete = role === "admin" || role === "sales";

  // Admin job creation
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [jobForm, setJobForm] = useState({ title: "", priority: "normal", dueDate: "", notes: "" });
  const [creating, setCreating] = useState(false);

  const handleCreateJob = async () => {
    if (!jobForm.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const token = localStorage.getItem("printhub_token");
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: jobForm.title,
          priority: jobForm.priority,
          dueDate: jobForm.dueDate || null,
          notes: jobForm.notes,
        }),
      });
      if (res.ok) {
        toast({ title: "Job created", variant: "success" });
        setCreateDialogOpen(false);
        setJobForm({ title: "", priority: "normal", dueDate: "", notes: "" });
        refetch();
      } else {
        const err = await res.json();
        toast({ title: err.error || "Failed to create job", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to create job", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast({ title: "Job deleted", variant: "success" });
        if (expandedJob === jobId) setExpandedJob(null);
        refetch();
      } else {
        const err = await response.json();
        toast({ title: "Failed to delete", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete job", variant: "destructive" });
    }
  };

  const allJobs = jobs || [];
  const filteredJobs = activeTab === "all" ? allJobs : allJobs.filter((j: any) => j.status === activeTab);

  const handleMoveJob = async (jobId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Job updated",
          description: `Moved to ${columns.find((c) => c.status === newStatus)?.label}`,
          variant: "success",
        });
        refetch();
      } else {
        const err = await response.json();
        toast({ title: "Failed", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update job status", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Jobs</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">
              Track and manage your production jobs
            </p>
          </div>
          {canCreateDelete && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Job
            </Button>
          )}
        </div>
      </motion.div>

      {/* Expanded job detail */}
      {expandedJob && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <JobDetailPanel jobId={expandedJob} onClose={() => setExpandedJob(null)} />
        </motion.div>
      )}

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
                      <JobCard key={job.id} job={job} onMove={handleMoveJob} onExpand={setExpandedJob} onDelete={handleDeleteJob} userRole={role} />
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
                    <JobCard key={job.id} job={job} onMove={handleMoveJob} onExpand={setExpandedJob} onDelete={handleDeleteJob} userRole={role} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* Create Job Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Job Title *</Label>
              <Input
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                placeholder="e.g. Business Cards for ABC Ltd"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={jobForm.priority} onValueChange={(v) => setJobForm({ ...jobForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={jobForm.dueDate}
                  onChange={(e) => setJobForm({ ...jobForm, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={jobForm.notes}
                onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })}
                placeholder="Optional notes about this job"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={handleCreateJob} disabled={creating}>
                {creating ? "Creating..." : "Create Job"}
              </Button>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
