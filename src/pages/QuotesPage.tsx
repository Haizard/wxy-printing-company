import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Send, Check, X, ArrowRight, Trash2, FileSpreadsheet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatTZS } from "@/lib/utils";
import { generatePDF, generateCSV, formatDate } from "@/lib/export-utils";
import { useQuotes, useJobs } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";

const statusConfig: Record<string, { color: "default" | "secondary" | "success" | "warning" | "danger"; label: string }> = {
  draft: { color: "secondary", label: "Draft" },
  sent: { color: "default", label: "Sent" },
  accepted: { color: "success", label: "Accepted" },
  expired: { color: "danger", label: "Expired" },
  converted: { color: "success", label: "Converted" },
};

export default function QuotesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { data: quotes, loading, refetch } = useQuotes();
  const { refetch: refetchJobs } = useJobs();
  const { toast } = useToast();
  const [converting, setConverting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filteredQuotes = activeTab === "all"
    ? quotes || []
    : (quotes || []).filter((q: any) => q.status === activeTab);

  const handleConvertToJob = async (quoteId: string) => {
    setConverting(quoteId);
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch(`/api/quotes/${quoteId}/convert-to-job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priority: "normal" }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Job created!",
          description: `${data.job.jobNumber} created from ${data.quote.quoteNumber}`,
          variant: "success",
        });
        refetch();
        refetchJobs();
      } else {
        const err = await response.json();
        toast({
          title: "Failed to convert",
          description: err.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to convert quote to job",
        variant: "destructive",
      });
    } finally {
      setConverting(null);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm("Delete this quote? This cannot be undone.")) return;
    setDeleting(quoteId);
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast({ title: "Quote deleted", variant: "success" });
        refetch();
      } else {
        const err = await response.json();
        toast({ title: "Failed to delete", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete quote", variant: "destructive" });
    } finally {
      setDeleting(null);
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
            <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Quotes</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">
              Manage and track your quotes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              const quotesData = quotes || [];
              generateCSV({
                filename: `wxy-quotes-${new Date().toISOString().split("T")[0]}`,
                columns: [
                  { header: "Quote #", accessor: "quoteNumber" },
                  { header: "Customer", accessor: (r: any) => r.customerName || "—" },
                  { header: "Status", accessor: "status" },
                  { header: "Total", accessor: "total" },
                  { header: "Date", accessor: (r: any) => formatDate(r.createdAt) },
                ],
                data: quotesData,
              });
            }}>
              <FileSpreadsheet className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const quotesData = quotes || [];
              generatePDF({
                title: "Quotes Report",
                subtitle: `${quotesData.length} total quotes`,
                filename: `wxy-quotes-${new Date().toISOString().split("T")[0]}`,
                columns: [
                  { header: "Quote #", accessor: "quoteNumber" },
                  { header: "Customer", accessor: (r: any) => r.customerName || "—" },
                  { header: "Status", accessor: "status" },
                  { header: "Total", accessor: (r: any) => formatTZS(r.total || 0) },
                  { header: "Date", accessor: (r: any) => formatDate(r.createdAt) },
                ],
                data: quotesData,
              });
            }}>
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="converted">Converted</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />
              ))}
            </div>
          ) : filteredQuotes.length === 0 ? (
            <Card className="mt-4">
              <CardContent className="text-center py-12">
                <FileText className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
                <p className="text-subhead text-[var(--text-tertiary)]">
                  No quotes yet. Use the calculator to create one.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {filteredQuotes.map((quote: any, index: number) => {
                const config = statusConfig[quote.status] || statusConfig.draft;
                const canConvert = ["draft", "sent", "accepted"].includes(quote.status);
                return (
                  <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-[var(--glass-shadow)] transition-all duration-200">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <p className="text-headline font-semibold">{quote.quoteNumber}</p>
                            <p className="text-caption text-[var(--text-tertiary)]">
                              {new Date(quote.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={config.color}>{config.label}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-[var(--text-tertiary)] hover:text-red-500"
                              onClick={() => handleDeleteQuote(quote.id)}
                              disabled={deleting === quote.id}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {quote.lines && quote.lines.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {quote.lines.map((line: any, i: number) => (
                              <p key={i} className="text-caption text-[var(--text-secondary)] truncate">
                                • {line.quantity}x @ {formatTZS(line.computedUnitPrice)}
                              </p>
                            ))}
                          </div>
                        )}

                        {quote.notes && (
                          <p className="text-caption text-[var(--text-tertiary)] mb-3 truncate">
                            {quote.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-[rgba(60,60,67,0.15)]">
                          <span className="text-headline font-bold text-[var(--accent-primary)]">
                            {formatTZS(quote.total)}
                          </span>
                          {canConvert && (
                            <Button
                              size="sm"
                              onClick={() => handleConvertToJob(quote.id)}
                              disabled={converting === quote.id}
                            >
                              {converting === quote.id ? (
                                "Converting..."
                              ) : (
                                <>
                                  <ArrowRight className="w-4 h-4 mr-1" />
                                  Convert to Job
                                </>
                              )}
                            </Button>
                          )}
                          {quote.status === "converted" && (
                            <Badge variant="success">
                              <Check className="w-3 h-3 mr-1" />
                              Job Created
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
