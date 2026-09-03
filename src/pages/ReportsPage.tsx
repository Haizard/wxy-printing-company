import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ClipboardList,
  FileText,
  Package,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTZS } from "@/lib/utils";
import { useJobs, useQuotes, useOrders, useInventory, useProducts, useCategories } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";

export default function ReportsPage() {
  const { user } = useAuth();
  const { data: jobs } = useJobs();
  const { data: quotes } = useQuotes();
  const { data: orders } = useOrders();
  const { data: inventory } = useInventory();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();

  // Revenue stats
  const totalRevenue = orders?.reduce((s: number, o: any) => s + (o.total || 0), 0) || 0;
  const paidOrders = orders?.filter((o: any) => o.status === "paid") || [];
  const paidRevenue = paidOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);

  // Job stats
  const jobsByStatus = {
    confirmed: jobs?.filter((j: any) => j.status === "confirmed").length || 0,
    in_production: jobs?.filter((j: any) => j.status === "in_production").length || 0,
    qa: jobs?.filter((j: any) => j.status === "qa").length || 0,
    ready: jobs?.filter((j: any) => j.status === "ready").length || 0,
    delivered: jobs?.filter((j: any) => j.status === "delivered").length || 0,
  };

  // Quote stats
  const quotesByStatus = {
    draft: quotes?.filter((q: any) => q.status === "draft").length || 0,
    sent: quotes?.filter((q: any) => q.status === "sent").length || 0,
    accepted: quotes?.filter((q: any) => q.status === "accepted").length || 0,
    converted: quotes?.filter((q: any) => q.status === "converted").length || 0,
  };

  // Inventory stats
  const totalItems = inventory?.length || 0;
  const lowStockItems = inventory?.filter((i: any) => parseFloat(i.currentQty) < parseFloat(i.reorderLevel)).length || 0;
  const totalStockValue = inventory?.reduce((s: number, i: any) => s + (i.unitCost || 0) * parseFloat(i.currentQty), 0) || 0;

  const isAdmin = user?.role === "admin";

  const statCards = [
    {
      title: "Total Revenue",
      value: formatTZS(totalRevenue),
      subtitle: `${orders?.length || 0} orders`,
      icon: DollarSign,
      color: "text-[var(--accent-success)]",
      bg: "bg-[rgba(52,199,89,0.1)]",
    },
    {
      title: "Paid Revenue",
      value: formatTZS(paidRevenue),
      subtitle: `${paidOrders.length} paid orders`,
      icon: TrendingUp,
      color: "text-[var(--accent-tertiary)]",
      bg: "bg-[rgba(46,125,255,0.1)]",
    },
    {
      title: "Total Jobs",
      value: String(jobs?.length || 0),
      subtitle: `${jobsByStatus.in_production} in production`,
      icon: ClipboardList,
      color: "text-[var(--accent-primary)]",
      bg: "bg-[rgba(255,90,60,0.1)]",
    },
    ...(isAdmin ? [{
      title: "Conversion Rate",
      value: `${quotes?.length ? Math.round((quotesByStatus.converted / quotes.length) * 100) : 0}%`,
      subtitle: `${quotesByStatus.converted}/${quotes?.length || 0} converted`,
      icon: BarChart3,
      color: "text-[var(--accent-secondary)]",
      bg: "bg-[rgba(255,176,32,0.1)]",
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Reports</h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Business insights and performance metrics
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
          >
            <Card>
              <CardContent className="flex items-start justify-between">
                <div>
                  <p className="text-caption text-[var(--text-secondary)]">{stat.title}</p>
                  <p className="text-title-2 font-bold mt-1">{stat.value}</p>
                  <p className="text-caption text-[var(--text-tertiary)] mt-1">{stat.subtitle}</p>
                </div>
                <div className={`w-10 h-10 rounded-[var(--radius-md)] ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Job Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Job Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(jobsByStatus).map(([status, count]) => {
              const total = jobs?.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                confirmed: "bg-[var(--accent-tertiary)]",
                in_production: "bg-[var(--accent-warning)]",
                qa: "bg-[var(--accent-primary)]",
                ready: "bg-[var(--accent-success)]",
                delivered: "bg-[var(--text-tertiary)]",
              };
              const labels: Record<string, string> = {
                confirmed: "Confirmed",
                in_production: "In Production",
                qa: "QA",
                ready: "Ready",
                delivered: "Delivered",
              };
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-subhead">{labels[status]}</span>
                    <span className="text-caption font-semibold">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--glass-fill-subtle)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[status]} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Quote Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Quote Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(quotesByStatus).map(([status, count]) => {
              const total = quotes?.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                draft: "bg-[var(--text-tertiary)]",
                sent: "bg-[var(--accent-secondary)]",
                accepted: "bg-[var(--accent-tertiary)]",
                converted: "bg-[var(--accent-success)]",
              };
              const labels: Record<string, string> = {
                draft: "Draft",
                sent: "Sent",
                accepted: "Accepted",
                converted: "Converted",
              };
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-subhead">{labels[status]}</span>
                    <span className="text-caption font-semibold">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--glass-fill-subtle)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[status]} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Inventory Overview — admin only */}
        {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
                <p className="text-title-2 font-bold">{totalItems}</p>
                <p className="text-caption text-[var(--text-tertiary)]">Total Items</p>
              </div>
              <div className="text-center p-3 rounded-[var(--radius-md)] bg-[rgba(255,159,10,0.1)]">
                <p className="text-title-2 font-bold text-[var(--accent-warning)]">{lowStockItems}</p>
                <p className="text-caption text-[var(--text-tertiary)]">Low Stock</p>
              </div>
              <div className="text-center p-3 rounded-[var(--radius-md)] bg-[rgba(52,199,89,0.1)]">
                <p className="text-title-2 font-bold text-[var(--accent-success)]">{formatTZS(totalStockValue)}</p>
                <p className="text-caption text-[var(--text-tertiary)]">Stock Value</p>
              </div>
            </div>
            {lowStockItems > 0 && (
              <div className="p-3 rounded-[var(--radius-md)] bg-[rgba(255,159,10,0.08)] border border-[rgba(255,159,10,0.2)]">
                <p className="text-subhead font-medium text-[var(--accent-warning)]">
                  ⚠️ {lowStockItems} items need reorder
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Catalog Stats */}
        {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Catalog Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
                <p className="text-title-2 font-bold">{categories?.length || 0}</p>
                <p className="text-caption text-[var(--text-tertiary)]">Categories</p>
              </div>
              <div className="text-center p-3 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
                <p className="text-title-2 font-bold">{products?.length || 0}</p>
                <p className="text-caption text-[var(--text-tertiary)]">Products</p>
              </div>
            </div>
            <div className="space-y-2">
              {categories?.slice(0, 6).map((cat: any) => {
                const catProducts = products?.filter((p: any) => p.categoryId === cat.id) || [];
                return (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-subhead">{cat.name}</span>
                    <Badge variant="secondary">{catProducts.length} products</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
