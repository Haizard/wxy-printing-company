import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTZS } from "@/lib/utils";
import { useJobs, useQuotes, useInventory, useLowStock, useOrders } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";

const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "danger"> = {
  in_production: "warning",
  qa: "default",
  ready: "success",
  confirmed: "secondary",
  delivered: "success",
  quote: "secondary",
  closed: "secondary",
  draft: "secondary",
  sent: "default",
  accepted: "success",
  converted: "success",
};

const statusLabels: Record<string, string> = {
  in_production: "In Production",
  qa: "QA",
  ready: "Ready",
  confirmed: "Confirmed",
  delivered: "Delivered",
  quote: "Quote",
  closed: "Closed",
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  converted: "Converted",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning ☀️";
  if (h < 17) return "Good afternoon 🌤️";
  return "Good evening 🌙";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: jobs, loading: jobsLoading } = useJobs();
  const { data: quotes, loading: quotesLoading } = useQuotes();
  const { data: inventory, loading: inventoryLoading } = useInventory();
  const { data: lowStock, loading: lowStockLoading } = useLowStock();
  const { data: orders, loading: ordersLoading } = useOrders();

  const activeJobs = jobs?.filter((j: any) => !["delivered", "closed"].includes(j.status)) || [];
  const pendingQuotes = quotes?.filter((q: any) => ["draft", "sent"].includes(q.status)) || [];
  const recentJobs = jobs?.slice(0, 5) || [];
  const recentQuotes = quotes?.slice(0, 5) || [];
  const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0;
  const deliveredJobs = jobs?.filter((j: any) => j.status === "delivered") || [];

  const isAdmin = user?.role === "admin" || user?.role === "sales";
  const isProduction = user?.role === "production";
  const isInventory = user?.role === "inventory_manager";

  const stats = [
    {
      title: "Active Jobs",
      value: String(activeJobs.length),
      change: `${jobs?.length || 0} total`,
      icon: ClipboardList,
      color: "text-[var(--accent-primary)]",
      bg: "bg-[rgba(255,90,60,0.1)]",
      href: "/jobs",
    },
    {
      title: "Pending Quotes",
      value: String(pendingQuotes.length),
      change: `${quotes?.length || 0} total`,
      icon: FileText,
      color: "text-[var(--accent-secondary)]",
      bg: "bg-[rgba(255,176,32,0.1)]",
      href: "/quotes",
    },
    ...(isAdmin
      ? [
          {
            title: "Total Revenue",
            value: formatTZS(totalRevenue),
            change: `${orders?.length || 0} orders`,
            icon: DollarSign,
            color: "text-[var(--accent-success)]",
            bg: "bg-[rgba(52,199,89,0.1)]",
            href: "/orders",
          },
        ]
      : []),
    {
      title: "Low Stock",
      value: String(lowStock?.length || 0),
      change: `${inventory?.length || 0} items`,
      icon: AlertTriangle,
      color: "text-[var(--accent-warning)]",
      bg: "bg-[rgba(255,159,10,0.1)]",
      href: "/inventory",
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
          {getGreeting()}, {user?.fullName?.split(" ")[0] || "there"}
        </h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          {isAdmin
            ? "Here's your print shop overview."
            : isProduction
              ? "Here's your production queue."
              : isInventory
                ? "Here's your inventory status."
                : "Here's what's happening with your orders."}
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
            <Link to={stat.href}>
              <Card className="cursor-pointer hover:shadow-[var(--glass-shadow)] transition-all duration-200 hover:scale-[0.98]">
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
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Billing Summary Widget */}
      <BillingWidget />

      {/* Recent Jobs + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Jobs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{isProduction ? "Your Queue" : "Recent Jobs"}</CardTitle>
                <Link to="/jobs">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
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

          {/* Recent Quotes (admin/sales only) */}
          {isAdmin && (
            <Card className="mt-5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Quotes</CardTitle>
                  <Link to="/quotes">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {quotesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)] animate-pulse" />
                    ))}
                  </div>
                ) : recentQuotes.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                    <p className="text-caption text-[var(--text-tertiary)]">No quotes yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentQuotes.map((q: any) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-[rgba(255,90,60,0.04)] transition-colors"
                      >
                        <div>
                          <p className="text-subhead font-medium">{q.quoteNumber}</p>
                          <p className="text-caption text-[var(--text-tertiary)]">
                            {formatTZS(q.total)}
                          </p>
                        </div>
                        <Badge variant={statusColors[q.status] || "secondary"}>
                          {statusLabels[q.status] || q.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions + Overview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/calculator">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  New Quote
                </Button>
              </Link>
              <Link to="/catalog">
                <Button className="w-full justify-start" variant="outline">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Browse Catalog
                </Button>
              </Link>
              {(isAdmin || isInventory) && (
                <Link to="/inventory">
                  <Button className="w-full justify-start" variant="outline">
                    <Package className="w-4 h-4 mr-2" />
                    Inventory
                  </Button>
                </Link>
              )}
              <Link to="/chat">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Messages
                </Button>
              </Link>
              {isAdmin && (
                <>
                  <div className="pt-2 border-t border-[rgba(60,60,67,0.1)]">
                    <p className="text-caption text-[var(--text-tertiary)] mb-2 font-medium">Billing</p>
                  </div>
                  <Link to="/estimates">
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Estimates
                    </Button>
                  </Link>
                  <Link to="/invoices">
                    <Button className="w-full justify-start" variant="outline">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Invoices
                    </Button>
                  </Link>
                  <Link to="/customers">
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="w-4 h-4 mr-2" />
                      Customers
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--accent-warning)]" />
                  <span className="text-subhead">In Production</span>
                </div>
                <span className="text-subhead font-semibold">
                  {jobs?.filter((j: any) => j.status === "in_production").length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[var(--accent-success)]" />
                  <span className="text-subhead">Ready for Pickup</span>
                </div>
                <span className="text-subhead font-semibold">
                  {jobs?.filter((j: any) => j.status === "ready").length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--accent-tertiary)]" />
                  <span className="text-subhead">Delivered</span>
                </div>
                <span className="text-subhead font-semibold">{deliveredJobs.length}</span>
              </div>
              {isAdmin && (
                <div className="flex items-center justify-between pt-2 border-t border-[rgba(60,60,67,0.15)]">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[var(--accent-success)]" />
                    <span className="text-subhead font-medium">Revenue</span>
                  </div>
                  <span className="text-subhead font-bold">{formatTZS(totalRevenue)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Billing Summary Widget ────────────────────────────────────────────────
function BillingWidget() {
  const [stats, setStats] = useState<{ totalInvoiced: number; totalPaid: number; outstanding: number; overdue: number; recentInvoices: any[] }>({ totalInvoiced: 0, totalPaid: 0, outstanding: 0, overdue: 0, recentInvoices: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("printhub_token");
    const headers = { Authorization: `Bearer ${token || ""}` };
    fetch("/api/invoices", { headers })
      .then(r => r.json())
      .then((invoices: any[]) => {
        const totalInvoiced = invoices.reduce((s: number, i: any) => s + (i.total || 0), 0);
        const totalPaid = invoices.reduce((s: number, i: any) => s + (i.amountPaid || 0), 0);
        const outstanding = invoices.reduce((s: number, i: any) => s + Math.max(0, (i.total || 0) - (i.amountPaid || 0)), 0);
        const overdue = invoices.filter((i: any) => i.status === "overdue").length;
        setStats({ totalInvoiced, totalPaid, outstanding, overdue, recentInvoices: invoices.slice(0, 5) });
      })
      .catch(() => {}) // silently ignore if billing not set up
      .finally(() => setLoading(false));
  }, []);

  if (loading || (stats.totalInvoiced === 0 && stats.recentInvoices.length === 0)) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[rgba(255,90,60,0.1)] flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <h3 className="text-headline font-semibold">Billing Overview</h3>
            </div>
            <Link to="/invoices">
              <Button size="sm" variant="ghost">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
              <p className="text-caption text-[var(--text-secondary)]">Total Invoiced</p>
              <p className="text-subhead font-bold">{formatTZS(stats.totalInvoiced)}</p>
            </div>
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
              <p className="text-caption text-[var(--text-secondary)]">Paid</p>
              <p className="text-subhead font-bold text-green-600">{formatTZS(stats.totalPaid)}</p>
            </div>
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
              <p className="text-caption text-[var(--text-secondary)]">Outstanding</p>
              <p className="text-subhead font-bold text-amber-600">{formatTZS(stats.outstanding)}</p>
            </div>
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
              <p className="text-caption text-[var(--text-secondary)]">Overdue</p>
              <p className="text-subhead font-bold text-red-600">{stats.overdue}</p>
            </div>
          </div>
          {stats.recentInvoices.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[rgba(60,60,67,0.1)]">
              <p className="text-caption text-[var(--text-tertiary)] mb-2">Recent Invoices</p>
              <div className="space-y-1.5">
                {stats.recentInvoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-primary)]">{inv.invoiceNumber}</span>
                    <span className="text-[var(--text-secondary)]">{inv.customerName || "—"}</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatTZS(inv.total)}</span>
                    <Badge variant={inv.status === "paid" ? "success" : inv.status === "overdue" ? "danger" : "secondary"}>{inv.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
