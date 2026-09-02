import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Send, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatTZS } from "@/lib/utils";
import { useQuotes } from "@/hooks/useApi";

const statusConfig = {
  draft: { color: "secondary" as const, label: "Draft" },
  sent: { color: "default" as const, label: "Sent" },
  accepted: { color: "success" as const, label: "Accepted" },
  expired: { color: "danger" as const, label: "Expired" },
  converted: { color: "success" as const, label: "Converted" },
};

export default function QuotesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { data: quotes, loading } = useQuotes();

  const filteredQuotes = activeTab === "all"
    ? quotes || []
    : (quotes || []).filter((q: any) => q.status === activeTab);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Quotes</h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Manage and track your quotes
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
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
                const config = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.draft;
                return (
                  <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="cursor-pointer hover:shadow-[var(--glass-shadow)] transition-all duration-200 hover:scale-[0.98]">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <p className="text-headline font-semibold">{quote.quoteNumber}</p>
                            <p className="text-caption text-[var(--text-tertiary)]">
                              Created {new Date(quote.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={config.color}>{config.label}</Badge>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[rgba(60,60,67,0.15)]">
                          <span className="text-headline font-bold text-[var(--accent-primary)]">
                            {formatTZS(quote.total)}
                          </span>
                          {quote.notes && (
                            <p className="text-caption text-[var(--text-tertiary)] truncate max-w-[120px]">
                              {quote.notes}
                            </p>
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
