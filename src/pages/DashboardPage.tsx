import { motion } from "framer-motion";
import {
  FileText,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  ShoppingCart,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTZS } from "@/lib/utils";
import { useJobs, useQuotes, useInventory, useLowStock } from "@/hooks/useApi";

const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "danger"> = {
  in_production: "warning",
  qa: "default",
  ready: "success",
  confirmed: "secondary",
  delivered: "success",
  quote: "secondary",
  closed: "secondary",
};

const statusLabels: Record<string, string> = {
  in_production: "In Production",
  qa: "QA",
  ready: "Ready",
  confirmed: "Confirmed",
  delivered: "Delivered",
  quote: "Quote",
  closed: "Closed",
};

export default function DashboardPage() {
  const { data: jobs, loading: jobsLoading } = useJobs();
  const { data: quotes, loading: quotesLoading } = useQuotes();
  const { data: inventory, loading: inventoryLoading } = useInventory();
  const { data: lowStock, loading: lowStockLoading } = useLowStock();

  const activeJobs = jobs?.filter((j: any) => !["delivered", "closed"].includes(j.status)) || [];
  const activeQuotes = quotes?.filter((q: any) => ["draft", "sent"].includes(q.status)) || [];
  const recentJobs = jobs?.slice(0, 5) || [];

  const stats = [
    {
      title: "Active Quotes",
      value: String(activeQuotes.length),
      change: `${quotes?.length || 0} total`,
      icon: FileText,
      color: "text-[var(--accent-primary)]",
      bg: "bg-[rgba(255,90,60,0.1)]",
    },
    {
      title: "In Production",
      value: String(activeJobs.length),
      change: `${jobs?.length || 0} total`,
      icon: ClipboardList,
      color: "text-[var(--accent-secondary)]",
      bg: "bg-[rgba(255,176,32,0.1)]",
    },
    {
      title: "Total Inventory Items",
      value: String(inventory?.length || 0),
      change: "All items",
      icon: Package,
      color: "text-[var(--accent-success)]",
      bg: "bg-[rgba(52,199,89,0.1)]",
    },
    {
      title: "Low Stock Items",
      value: String(lowStock?.length || 0),
      change: "Needs reorder",
      icon: AlertTriangle,
      color: "text-[var(--accent-warning)]",
      bg: "bg-[rgba(255,159,10,0.1)]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">
          Good morning ☀️
        </h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Here's what's happening with your print shop today.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
          >
            <Card>
              <CardContent className="flex items-start justify-between">
                <div>
                  <p className="text-caption text-[var(--text-secondary)]">
                    {stat.title}
                  </p>
                  <p className="text-title-2 font-bold mt-1">{stat.value}</p>
                  <p className="text-caption text-[var(--text-tertiary)] mt-1">
                    {stat.change}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-[var(--radius-md)] ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Jobs + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Jobs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Jobs</CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)] animate-pulse" />
                  ))}
                </div>
              ) : recentJobs.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
                  <p className="text-subhead text-[var(--text-tertiary)]">
                    No jobs yet. Create a quote to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-[rgba(255,90,60,0.04)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--glass-fill-subtle)] flex items-center justify-center">
                          <ClipboardList className="w-5 h-5 text-[var(--text-tertiary)]" />
                        </div>
                        <div>
                          <p className="text-subhead font-medium">{job.title}</p>
                          <p className="text-caption text-[var(--text-tertiary)]">
                            {job.jobNumber}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusColors[job.status] || "secondary"}>
                        {statusLabels[job.status] || job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                New Quote
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Create Order
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Package className="w-4 h-4 mr-2" />
                Record Stock Movement
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--accent-warning)]" />
                  <span className="text-subhead">Pending Quotes</span>
                </div>
                <span className="text-subhead font-semibold">{activeQuotes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[var(--accent-success)]" />
                  <span className="text-subhead">Active Jobs</span>
                </div>
                <span className="text-subhead font-semibold">{activeJobs.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[var(--accent-warning)]" />
                  <span className="text-subhead">Low Stock Alerts</span>
                </div>
                <span className="text-subhead font-semibold">{lowStock?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
