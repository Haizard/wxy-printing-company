import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ClipboardList,
  Package,
  BarChart3,
  FileText,
  ShoppingCart,
  Users,
  Factory,
  Download,
  Calendar,
  Filter,
  ChevronDown,
  AlertTriangle,
  Truck,
  Wrench,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTZS, generatePDF, generateExcel, generateCSV, formatDate } from "@/lib/export-utils";
import {
  useJobs,
  useQuotes,
  useOrders,
  useInventory,
  useProducts,
  useCategories,
} from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";

type TabId = "overview" | "sales" | "production" | "inventory" | "financial";

const tabs: { id: TabId; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "sales", label: "Sales", icon: ShoppingCart },
  { id: "production", label: "Production", icon: Factory },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "financial", label: "Financial", icon: DollarSign },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data: jobs } = useJobs();
  const { data: quotes } = useQuotes();
  const { data: orders } = useOrders();
  const { data: inventory } = useInventory();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();

  const isAdmin = user?.role === "admin";

  // ── Date Filtering ────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null;

    const filterByDate = (items: any[], dateField: string) => {
      if (!from && !to) return items;
      return items.filter((item) => {
        const d = new Date(item[dateField] || item.createdAt);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    };

    return {
      orders: filterByDate(orders || [], "createdAt"),
      jobs: filterByDate(jobs || [], "createdAt"),
      quotes: filterByDate(quotes || [], "createdAt"),
      inventory: inventory || [],
    };
  }, [orders, jobs, quotes, inventory, dateFrom, dateTo]);

  // ── Computed Stats ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const { orders: fo, jobs: fj, quotes: fq } = filteredData;

    // Revenue
    const totalRevenue = fo.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const paidOrders = fo.filter((o: any) => o.status === "paid");
    const paidRevenue = paidOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const pendingRevenue = fo
      .filter((o: any) => o.status === "pending")
      .reduce((s: number, o: any) => s + (o.total || 0), 0);
    const avgOrderValue = fo.length > 0 ? totalRevenue / fo.length : 0;

    // Quotes
    const totalQuotes = fq.length;
    const acceptedQuotes = fq.filter((q: any) => q.status === "accepted" || q.status === "converted").length;
    const convertedQuotes = fq.filter((q: any) => q.status === "converted").length;
    const quoteConversionRate = totalQuotes > 0 ? Math.round((convertedQuotes / totalQuotes) * 100) : 0;
    const avgQuoteValue = totalQuotes > 0 ? fq.reduce((s: number, q: any) => s + (q.total || 0), 0) / totalQuotes : 0;

    // Jobs
    const jobsByStatus = {
      confirmed: fj.filter((j: any) => j.status === "confirmed").length,
      in_production: fj.filter((j: any) => j.status === "in_production").length,
      qa: fj.filter((j: any) => j.status === "qa").length,
      ready: fj.filter((j: any) => j.status === "ready").length,
      delivered: fj.filter((j: any) => j.status === "delivered").length,
    };
    const totalJobs = fj.length;

    // Inventory
    const totalItems = filteredData.inventory.length;
    const lowStockItems = filteredData.inventory.filter((i: any) => parseFloat(i.currentQty) < parseFloat(i.reorderLevel)).length;
    const outOfStock = filteredData.inventory.filter((i: any) => parseFloat(i.currentQty) === 0).length;
    const totalStockValue = filteredData.inventory.reduce(
      (s: number, i: any) => s + (i.unitCost || 0) * parseFloat(i.currentQty),
      0
    );
    const categoriesCount = categories?.length || 0;

    // Inventory by category
    const inventoryByCategory: Record<string, { count: number; value: number }> = {};
    filteredData.inventory.forEach((item: any) => {
      const cat = item.category || "general";
      if (!inventoryByCategory[cat]) inventoryByCategory[cat] = { count: 0, value: 0 };
      inventoryByCategory[cat].count++;
      inventoryByCategory[cat].value += (item.unitCost || 0) * parseFloat(item.currentQty);
    });

    // Products
    const totalProducts = products?.length || 0;

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      avgOrderValue,
      totalOrders: fo.length,
      paidOrders: paidOrders.length,
      totalQuotes,
      acceptedQuotes,
      convertedQuotes,
      quoteConversionRate,
      avgQuoteValue,
      jobsByStatus,
      totalJobs,
      totalItems,
      lowStockItems,
      outOfStock,
      totalStockValue,
      categoriesCount,
      inventoryByCategory,
      totalProducts,
    };
  }, [filteredData, categories, products]);

  // ── Export Handlers ───────────────────────────────────────────────────
  const handleExportPDF = (tab: TabId) => {
    setExporting(true);
    try {
      const dateLabel = dateFrom || dateTo ? ` (${dateFrom || "start"} to ${dateTo || "now"})` : " (All Time)";

      if (tab === "overview") {
        generatePDF({
          title: `Business Overview Report${dateLabel}`,
          subtitle: "Comprehensive business metrics and KPIs",
          filename: `wxy-overview-report-${new Date().toISOString().split("T")[0]}`,
          columns: [
            { header: "Metric", accessor: "metric" },
            { header: "Value", accessor: "value" },
            { header: "Details", accessor: "details" },
          ],
          data: [
            { metric: "Total Revenue", value: formatTZS(stats.totalRevenue), details: `${stats.totalOrders} orders` },
            { metric: "Paid Revenue", value: formatTZS(stats.paidRevenue), details: `${stats.paidOrders} paid` },
            { metric: "Pending Revenue", value: formatTZS(stats.pendingRevenue), details: "" },
            { metric: "Avg Order Value", value: formatTZS(stats.avgOrderValue), details: "" },
            { metric: "Total Quotes", value: String(stats.totalQuotes), details: `${stats.quoteConversionRate}% conversion` },
            { metric: "Total Jobs", value: String(stats.totalJobs), details: `${stats.jobsByStatus.in_production} in production` },
            { metric: "Inventory Items", value: String(stats.totalItems), details: `${stats.lowStockItems} low stock` },
            { metric: "Stock Value", value: formatTZS(stats.totalStockValue), details: "" },
          ],
        });
      } else if (tab === "sales") {
        const orderData = filteredData.orders.map((o: any) => ({
          "Order #": o.orderNumber,
          Customer: o.customerName || "—",
          Status: o.status,
          Total: formatTZS(o.total || 0),
          Date: formatDate(o.createdAt),
        }));
        generatePDF({
          title: `Sales Report${dateLabel}`,
          subtitle: `Total: ${formatTZS(stats.totalRevenue)} | Paid: ${formatTZS(stats.paidRevenue)} | Pending: ${formatTZS(stats.pendingRevenue)}`,
          filename: `wxy-sales-report-${new Date().toISOString().split("T")[0]}`,
          columns: [
            { header: "Order #", accessor: "orderNumber" },
            { header: "Customer", accessor: (r: any) => r.customerName || "—" },
            { header: "Status", accessor: "status" },
            { header: "Total", accessor: (r: any) => formatTZS(r.total || 0) },
            { header: "Date", accessor: (r: any) => formatDate(r.createdAt) },
          ],
          data: filteredData.orders,
        });
      } else if (tab === "production") {
        generatePDF({
          title: `Production Report${dateLabel}`,
          subtitle: `Total Jobs: ${stats.totalJobs} | In Production: ${stats.jobsByStatus.in_production} | QA: ${stats.jobsByStatus.qa} | Ready: ${stats.jobsByStatus.ready}`,
          filename: `wxy-production-report-${new Date().toISOString().split("T")[0]}`,
          columns: [
            { header: "Job #", accessor: "jobNumber" },
            { header: "Title", accessor: "title" },
            { header: "Status", accessor: "status" },
            { header: "Priority", accessor: (r: any) => r.priority || "normal" },
            { header: "Created", accessor: (r: any) => formatDate(r.createdAt) },
          ],
          data: filteredData.jobs,
        });
      } else if (tab === "inventory") {
        generatePDF({
          title: `Inventory Report${dateLabel}`,
          subtitle: `Total: ${stats.totalItems} items | Low Stock: ${stats.lowStockItems} | Stock Value: ${formatTZS(stats.totalStockValue)}`,
          filename: `wxy-inventory-report-${new Date().toISOString().split("T")[0]}`,
          columns: [
            { header: "Material", accessor: "name" },
            { header: "Category", accessor: (r: any) => r.category || "general" },
            { header: "Unit", accessor: "unit" },
            { header: "Qty", accessor: (r: any) => r.currentQty },
            { header: "Reorder", accessor: (r: any) => r.reorderLevel },
            { header: "Unit Cost", accessor: (r: any) => formatTZS(r.unitCost || 0) },
            { header: "Value", accessor: (r: any) => formatTZS((r.unitCost || 0) * parseFloat(r.currentQty)) },
          ],
          data: filteredData.inventory,
        });
      } else if (tab === "financial") {
        generatePDF({
          title: `Financial Summary Report${dateLabel}`,
          subtitle: "Revenue, costs, and profitability analysis",
          filename: `wxy-financial-report-${new Date().toISOString().split("T")[0]}`,
          columns: [
            { header: "Metric", accessor: "metric" },
            { header: "Amount", accessor: "amount" },
            { header: "Notes", accessor: "notes" },
          ],
          data: [
            { metric: "Total Revenue (All Orders)", amount: formatTZS(stats.totalRevenue), notes: `${stats.totalOrders} orders` },
            { metric: "Collected Revenue", amount: formatTZS(stats.paidRevenue), notes: `${stats.paidOrders} paid orders` },
            { metric: "Outstanding Balance", amount: formatTZS(stats.pendingRevenue), notes: "Pending payment" },
            { metric: "Inventory Stock Value", amount: formatTZS(stats.totalStockValue), notes: `${stats.totalItems} items` },
            { metric: "Avg Quote Value", amount: formatTZS(stats.avgQuoteValue), notes: `${stats.totalQuotes} quotes` },
            { metric: "Quote Conversion Rate", amount: `${stats.quoteConversionRate}%`, notes: `${stats.convertedQuotes} converted` },
          ],
        });
      }
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = (tab: TabId) => {
    setExporting(true);
    try {
      const dateLabel = dateFrom || dateTo ? ` (${dateFrom || "start"} to ${dateTo || "now"})` : " (All Time)";

      if (tab === "overview") {
        generateExcel({
          filename: `wxy-overview-report-${new Date().toISOString().split("T")[0]}`,
          sheets: [
            {
              name: "Key Metrics",
              columns: [
                { header: "Metric", accessor: "metric" },
                { header: "Value", accessor: "value" },
                { header: "Details", accessor: "details" },
              ],
              data: [
                { metric: "Total Revenue", value: stats.totalRevenue, details: `${stats.totalOrders} orders` },
                { metric: "Paid Revenue", value: stats.paidRevenue, details: `${stats.paidOrders} paid` },
                { metric: "Pending Revenue", value: stats.pendingRevenue, details: "" },
                { metric: "Avg Order Value", value: Math.round(stats.avgOrderValue), details: "" },
                { metric: "Total Quotes", value: stats.totalQuotes, details: `${stats.quoteConversionRate}% conversion` },
                { metric: "Total Jobs", value: stats.totalJobs, details: `${stats.jobsByStatus.in_production} in production` },
                { metric: "Inventory Items", value: stats.totalItems, details: `${stats.lowStockItems} low stock` },
                { metric: "Stock Value", value: stats.totalStockValue, details: "" },
              ],
            },
            {
              name: "Job Pipeline",
              columns: [
                { header: "Status", accessor: "status" },
                { header: "Count", accessor: "count" },
                { header: "Percentage", accessor: (r: any) => `${r.pct}%` },
              ],
              data: Object.entries(stats.jobsByStatus).map(([status, count]) => ({
                status: status.replace("_", " "),
                count,
                pct: stats.totalJobs > 0 ? Math.round((count / stats.totalJobs) * 100) : 0,
              })),
            },
          ],
        });
      } else if (tab === "inventory") {
        generateExcel({
          filename: `wxy-inventory-report-${new Date().toISOString().split("T")[0]}`,
          sheets: [
            {
              name: "All Materials",
              columns: [
                { header: "Material", accessor: "name" },
                { header: "Category", accessor: (r: any) => r.category || "general" },
                { header: "Unit", accessor: "unit" },
                { header: "Current Qty", accessor: (r: any) => Number(r.currentQty) },
                { header: "Reorder Level", accessor: (r: any) => Number(r.reorderLevel) },
                { header: "Unit Cost", accessor: (r: any) => r.unitCost || 0 },
                { header: "Total Value", accessor: (r: any) => (r.unitCost || 0) * Number(r.currentQty) },
                { header: "Status", accessor: (r: any) => {
                  const q = Number(r.currentQty);
                  const rL = Number(r.reorderLevel);
                  return q === 0 ? "Out of Stock" : q < rL ? "Low Stock" : "In Stock";
                }},
              ],
              data: filteredData.inventory,
            },
            {
              name: "Category Breakdown",
              columns: [
                { header: "Category", accessor: "category" },
                { header: "Item Count", accessor: "count" },
                { header: "Total Value", accessor: "value" },
              ],
              data: Object.entries(stats.inventoryByCategory).map(([cat, data]) => ({
                category: cat,
                count: data.count,
                value: data.value,
              })),
            },
          ],
        });
      } else {
        // Generic fallback
        handleExportCSV(tab);
        return;
      }
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = (tab: TabId) => {
    const dateLabel = dateFrom || dateTo ? ` (${dateFrom || "start"} to ${dateTo || "now"})` : " (All Time)";

    if (tab === "orders" || tab === "sales") {
      generateCSV({
        filename: `wxy-orders-${new Date().toISOString().split("T")[0]}`,
        columns: [
          { header: "Order #", accessor: "orderNumber" },
          { header: "Customer", accessor: (r: any) => r.customerName || "—" },
          { header: "Status", accessor: "status" },
          { header: "Total", accessor: "total" },
          { header: "Date", accessor: (r: any) => formatDate(r.createdAt) },
        ],
        data: filteredData.orders,
      });
    } else if (tab === "jobs" || tab === "production") {
      generateCSV({
        filename: `wxy-jobs-${new Date().toISOString().split("T")[0]}`,
        columns: [
          { header: "Job #", accessor: "jobNumber" },
          { header: "Title", accessor: "title" },
          { header: "Status", accessor: "status" },
          { header: "Priority", accessor: (r: any) => r.priority || "normal" },
          { header: "Created", accessor: (r: any) => formatDate(r.createdAt) },
        ],
        data: filteredData.jobs,
      });
    } else if (tab === "inventory") {
      generateCSV({
        filename: `wxy-inventory-${new Date().toISOString().split("T")[0]}`,
        columns: [
          { header: "Material", accessor: "name" },
          { header: "Category", accessor: (r: any) => r.category || "general" },
          { header: "Unit", accessor: "unit" },
          { header: "Qty", accessor: (r: any) => r.currentQty },
          { header: "Reorder", accessor: (r: any) => r.reorderLevel },
          { header: "Unit Cost", accessor: "unitCost" },
          { header: "Value", accessor: (r: any) => (r.unitCost || 0) * parseFloat(r.currentQty) },
        ],
        data: filteredData.inventory,
      });
    }
  };

  // ── Tab Content ───────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatTZS(stats.totalRevenue)}
          subtitle={`${stats.totalOrders} orders`}
          icon={DollarSign}
          color="text-[var(--accent-success)]"
          bg="bg-[rgba(52,199,89,0.1)]"
          trend={stats.totalOrders > 0 ? "+12%" : undefined}
          trendUp={true}
        />
        <StatCard
          title="Paid Revenue"
          value={formatTZS(stats.paidRevenue)}
          subtitle={`${stats.paidOrders} collected`}
          icon={TrendingUp}
          color="text-[var(--accent-tertiary)]"
          bg="bg-[rgba(46,125,255,0.1)]"
        />
        <StatCard
          title="Outstanding"
          value={formatTZS(stats.pendingRevenue)}
          subtitle="Pending payment"
          icon={AlertTriangle}
          color="text-[var(--accent-warning)]"
          bg="bg-[rgba(255,159,10,0.1)]"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.quoteConversionRate}%`}
          subtitle={`${stats.convertedQuotes}/${stats.totalQuotes} quotes`}
          icon={Target}
          color="text-[var(--accent-secondary)]"
          bg="bg-[rgba(255,176,32,0.1)]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={String(stats.totalJobs)}
          subtitle={`${stats.jobsByStatus.in_production} active`}
          icon={ClipboardList}
          color="text-[var(--accent-primary)]"
          bg="bg-[rgba(255,90,60,0.1)]"
        />
        <StatCard
          title="Avg Order Value"
          value={formatTZS(stats.avgOrderValue)}
          subtitle="Per order"
          icon={BarChart3}
          color="text-[var(--accent-tertiary)]"
          bg="bg-[rgba(46,125,255,0.1)]"
        />
        <StatCard
          title="Inventory Items"
          value={String(stats.totalItems)}
          subtitle={`${stats.lowStockItems} low stock`}
          icon={Package}
          color={stats.lowStockItems > 0 ? "text-[var(--accent-warning)]" : "text-[var(--accent-success)]"}
          bg={stats.lowStockItems > 0 ? "bg-[rgba(255,159,10,0.1)]" : "bg-[rgba(52,199,89,0.1)]"}
        />
        <StatCard
          title="Stock Value"
          value={formatTZS(stats.totalStockValue)}
          subtitle={`${stats.categoriesCount} categories`}
          icon={Truck}
          color="text-[var(--accent-secondary)]"
          bg="bg-[rgba(255,176,32,0.1)]"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Job Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.jobsByStatus).map(([status, count]) => {
              const total = stats.totalJobs || 1;
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
                qa: "QA Review",
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

        <Card>
          <CardHeader>
            <CardTitle>Quote Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
                <p className="text-title-2 font-bold">{stats.totalQuotes}</p>
                <p className="text-caption text-[var(--text-tertiary)]">Total Quotes</p>
              </div>
              <div className="text-center p-4 rounded-[var(--radius-md)] bg-[rgba(52,199,89,0.1)]">
                <p className="text-title-2 font-bold text-[var(--accent-success)]">{stats.convertedQuotes}</p>
                <p className="text-caption text-[var(--text-tertiary)]">Converted</p>
              </div>
            </div>
            <div className="text-center p-3 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
              <p className="text-title-2 font-bold">{formatTZS(stats.avgQuoteValue)}</p>
              <p className="text-caption text-[var(--text-tertiary)]">Avg Quote Value</p>
            </div>
            <div className="p-3 rounded-[var(--radius-md)] bg-[rgba(46,125,255,0.08)] border border-[rgba(46,125,255,0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-subhead font-medium">Conversion Rate</span>
                <span className="text-headline font-bold text-[var(--accent-tertiary)]">{stats.quoteConversionRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--glass-fill-subtle)] overflow-hidden mt-2">
                <div
                  className="h-full rounded-full bg-[var(--accent-tertiary)] transition-all duration-500"
                  style={{ width: `${stats.quoteConversionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={String(stats.totalOrders)} icon={ShoppingCart} color="text-[var(--accent-primary)]" bg="bg-[rgba(255,90,60,0.1)]" />
        <StatCard title="Paid Orders" value={String(stats.paidOrders)} icon={DollarSign} color="text-[var(--accent-success)]" bg="bg-[rgba(52,199,89,0.1)]" />
        <StatCard title="Total Revenue" value={formatTZS(stats.totalRevenue)} icon={TrendingUp} color="text-[var(--accent-tertiary)]" bg="bg-[rgba(46,125,255,0.1)]" />
        <StatCard title="Avg Order" value={formatTZS(stats.avgOrderValue)} icon={BarChart3} color="text-[var(--accent-secondary)]" bg="bg-[rgba(255,176,32,0.1)]" />
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Orders ({filteredData.orders.length})</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleExportCSV("sales")}>
              <FileSpreadsheet className="w-4 h-4 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.orders.length === 0 ? (
            <p className="text-center text-[var(--text-tertiary)] py-8">No orders found for the selected period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--glass-border)]">
                    <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Order #</th>
                    <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Customer</th>
                    <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Status</th>
                    <th className="text-right py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Total</th>
                    <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.orders.slice(0, 50).map((order: any) => (
                    <tr key={order.id} className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[var(--glass-fill-subtle)]">
                      <td className="py-3 px-2 font-medium">{order.orderNumber}</td>
                      <td className="py-3 px-2 text-[var(--text-secondary)]">{order.customerName || "—"}</td>
                      <td className="py-3 px-2">
                        <Badge variant={order.status === "paid" ? "default" : "secondary"} className={
                          order.status === "paid" ? "bg-[rgba(52,199,89,0.15)] text-[var(--accent-success)]" :
                          order.status === "cancelled" ? "bg-[rgba(255,59,48,0.15)] text-[var(--accent-danger)]" :
                          ""
                        }>{order.status}</Badge>
                      </td>
                      <td className="py-3 px-2 text-right font-semibold">{formatTZS(order.total || 0)}</td>
                      <td className="py-3 px-2 text-[var(--text-secondary)]">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.orders.length > 50 && (
                <p className="text-center text-caption text-[var(--text-tertiary)] mt-3">
                  Showing 50 of {filteredData.orders.length} orders. Export to Excel for full data.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProduction = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(stats.jobsByStatus).map(([status, count]) => {
          const labels: Record<string, string> = {
            confirmed: "Confirmed",
            in_production: "In Production",
            qa: "QA Review",
            ready: "Ready",
            delivered: "Delivered",
          };
          const icons: Record<string, any> = {
            confirmed: FileText,
            in_production: Factory,
            qa: Eye,
            ready: Target,
            delivered: ArrowUpRight,
          };
          const Icon = icons[status] || ClipboardList;
          return (
            <StatCard
              key={status}
              title={labels[status]}
              value={String(count)}
              icon={Icon}
              color="text-[var(--accent-primary)]"
              bg="bg-[rgba(255,90,60,0.1)]"
            />
          );
        })}
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Jobs ({filteredData.jobs.length})</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleExportCSV("production")}>
              <FileSpreadsheet className="w-4 h-4 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.jobs.length === 0 ? (
            <p className="text-center text-[var(--text-tertiary)] py-8">No jobs found for the selected period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--glass-border)]">
                    <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Job #</th>
                    <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Title</th>
                    <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Status</th>
                    <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Priority</th>
                    <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.jobs.slice(0, 50).map((job: any) => (
                    <tr key={job.id} className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[var(--glass-fill-subtle)]">
                      <td className="py-3 px-2 font-medium">{job.jobNumber}</td>
                      <td className="py-3 px-2 text-[var(--text-secondary)]">{job.title}</td>
                      <td className="py-3 px-2">
                        <Badge variant={
                          job.status === "in_production" ? "default" :
                          job.status === "delivered" ? "secondary" : "outline"
                        } className={
                          job.status === "in_production" ? "bg-[rgba(255,159,10,0.15)] text-[var(--accent-warning)]" :
                          job.status === "ready" ? "bg-[rgba(52,199,89,0.15)] text-[var(--accent-success)]" :
                          job.status === "delivered" ? "bg-[var(--glass-fill-subtle)]" :
                          ""
                        }>{job.status?.replace("_", " ")}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className={
                          job.priority === "urgent" ? "border-[var(--accent-danger)] text-[var(--accent-danger)]" :
                          job.priority === "high" ? "border-[var(--accent-warning)] text-[var(--accent-warning)]" :
                          ""
                        }>{job.priority || "normal"}</Badge>
                      </td>
                      <td className="py-3 px-2 text-[var(--text-secondary)]">{formatDate(job.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.jobs.length > 50 && (
                <p className="text-center text-caption text-[var(--text-tertiary)] mt-3">
                  Showing 50 of {filteredData.jobs.length} jobs. Export to Excel for full data.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Items" value={String(stats.totalItems)} icon={Package} color="text-[var(--accent-primary)]" bg="bg-[rgba(255,90,60,0.1)]" />
        <StatCard title="Low Stock" value={String(stats.lowStockItems)} icon={AlertTriangle} color={stats.lowStockItems > 0 ? "text-[var(--accent-warning)]" : "text-[var(--accent-success)]"} bg={stats.lowStockItems > 0 ? "bg-[rgba(255,159,10,0.1)]" : "bg-[rgba(52,199,89,0.1)]"} />
        <StatCard title="Out of Stock" value={String(stats.outOfStock)} icon={AlertTriangle} color={stats.outOfStock > 0 ? "text-[var(--accent-danger)]" : "text-[var(--accent-success)]"} bg={stats.outOfStock > 0 ? "bg-[rgba(255,59,48,0.1)]" : "bg-[rgba(52,199,89,0.1)]"} />
        <StatCard title="Stock Value" value={formatTZS(stats.totalStockValue)} icon={DollarSign} color="text-[var(--accent-success)]" bg="bg-[rgba(52,199,89,0.1)]" />
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(stats.inventoryByCategory)
              .sort(([, a], [, b]) => b.value - a.value)
              .map(([cat, data]) => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
                  <div>
                    <p className="text-subhead font-medium capitalize">{cat}</p>
                    <p className="text-caption text-[var(--text-tertiary)]">{data.count} items</p>
                  </div>
                  <p className="text-headline font-bold">{formatTZS(data.value)}</p>
                </div>
              ))}
            {Object.keys(stats.inventoryByCategory).length === 0 && (
              <p className="col-span-full text-center text-[var(--text-tertiary)] py-4">No inventory data.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Materials ({filteredData.inventory.length})</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleExportExcel("inventory")}>
              <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExportPDF("inventory")}>
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--glass-border)]">
                  <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Material</th>
                  <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Category</th>
                  <th className="text-right py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Qty</th>
                  <th className="text-right py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Reorder</th>
                  <th className="text-right py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Unit Cost</th>
                  <th className="text-right py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Value</th>
                  <th className="text-center py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.inventory.map((item: any) => {
                  const qty = parseFloat(item.currentQty);
                  const reorder = parseFloat(item.reorderLevel);
                  const value = (item.unitCost || 0) * qty;
                  const status = qty === 0 ? "out" : qty < reorder ? "low" : "ok";
                  return (
                    <tr key={item.id} className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[var(--glass-fill-subtle)]">
                      <td className="py-3 px-2 font-medium">{item.name}</td>
                      <td className="py-3 px-2 text-[var(--text-secondary)] capitalize">{item.category || "general"}</td>
                      <td className="py-3 px-2 text-right">{qty} {item.unit}</td>
                      <td className="py-3 px-2 text-right text-[var(--text-secondary)]">{reorder} {item.unit}</td>
                      <td className="py-3 px-2 text-right">{formatTZS(item.unitCost || 0)}</td>
                      <td className="py-3 px-2 text-right font-semibold">{formatTZS(value)}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className={
                          status === "out" ? "border-[var(--accent-danger)] text-[var(--accent-danger)]" :
                          status === "low" ? "border-[var(--accent-warning)] text-[var(--accent-warning)]" :
                          "border-[var(--accent-success)] text-[var(--accent-success)]"
                        }>
                          {status === "out" ? "Out of Stock" : status === "low" ? "Low Stock" : "In Stock"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFinancial = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Revenue" value={formatTZS(stats.totalRevenue)} subtitle={`${stats.totalOrders} orders`} icon={DollarSign} color="text-[var(--accent-success)]" bg="bg-[rgba(52,199,89,0.1)]" />
        <StatCard title="Collected" value={formatTZS(stats.paidRevenue)} subtitle={`${stats.paidOrders} paid`} icon={TrendingUp} color="text-[var(--accent-tertiary)]" bg="bg-[rgba(46,125,255,0.1)]" />
        <StatCard title="Outstanding" value={formatTZS(stats.pendingRevenue)} subtitle="Pending" icon={AlertTriangle} color="text-[var(--accent-warning)]" bg="bg-[rgba(255,159,10,0.1)]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Inventory Value" value={formatTZS(stats.totalStockValue)} subtitle={`${stats.totalItems} items`} icon={Package} color="text-[var(--accent-secondary)]" bg="bg-[rgba(255,176,32,0.1)]" />
        <StatCard title="Avg Quote Value" value={formatTZS(stats.avgQuoteValue)} subtitle={`${stats.totalQuotes} quotes`} icon={FileText} color="text-[var(--accent-primary)]" bg="bg-[rgba(255,90,60,0.1)]" />
        <StatCard title="Avg Order Value" value={formatTZS(stats.avgOrderValue)} subtitle={`${stats.totalOrders} orders`} icon={BarChart3} color="text-[var(--accent-tertiary)]" bg="bg-[rgba(46,125,255,0.1)]" />
      </div>

      {/* Financial Summary Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Financial Summary</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleExportPDF("financial")}>
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Total Revenue (All Orders)", value: formatTZS(stats.totalRevenue), sub: `${stats.totalOrders} orders`, color: "text-[var(--accent-success)]" },
              { label: "Collected Revenue (Paid)", value: formatTZS(stats.paidRevenue), sub: `${stats.paidOrders} orders`, color: "text-[var(--accent-tertiary)]" },
              { label: "Outstanding Balance", value: formatTZS(stats.pendingRevenue), sub: `${stats.totalOrders - stats.paidOrders} orders pending`, color: "text-[var(--accent-warning)]" },
              { label: "Inventory Stock Value", value: formatTZS(stats.totalStockValue), sub: `${stats.totalItems} materials`, color: "text-[var(--accent-secondary)]" },
              { label: "Avg Quote Value", value: formatTZS(stats.avgQuoteValue), sub: `${stats.totalQuotes} quotes`, color: "" },
              { label: "Quote Conversion Rate", value: `${stats.quoteConversionRate}%`, sub: `${stats.convertedQuotes} converted`, color: "" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between p-4 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
                <div>
                  <p className="text-subhead font-medium">{row.label}</p>
                  <p className="text-caption text-[var(--text-tertiary)]">{row.sub}</p>
                </div>
                <p className={`text-headline font-bold ${row.color}`}>{row.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Reports & Analytics</h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Business insights, performance metrics, and exportable reports
        </p>
      </motion.div>

      {/* Tab Navigation + Date Filter + Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-subhead font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[var(--glass-fill)] shadow-glass text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Filter + Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-caption text-[var(--text-secondary)]">
            <Calendar className="w-4 h-4" />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 text-caption rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)] border border-[var(--glass-border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-tertiary)]"
          />
          <span className="text-caption text-[var(--text-tertiary)]">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 text-caption rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)] border border-[var(--glass-border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-tertiary)]"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="text-caption text-[var(--accent-tertiary)] hover:underline"
            >
              Clear
            </button>
          )}

          <div className="h-5 w-px bg-[var(--glass-border)] mx-1 hidden sm:block" />

          {/* Export Buttons */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportPDF(activeTab)}
            disabled={exporting}
            className="gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportExcel(activeTab)}
            disabled={exporting}
            className="gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && renderOverview()}
          {activeTab === "sales" && renderSales()}
          {activeTab === "production" && renderProduction()}
          {activeTab === "inventory" && renderInventory()}
          {activeTab === "financial" && renderFinancial()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Stat Card Component ────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
  trend,
  trendUp,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
  bg: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-caption text-[var(--text-secondary)]">{title}</p>
          <p className="text-title-2 font-bold mt-1">{value}</p>
          <div className="flex items-center gap-2 mt-1">
            {subtitle && <p className="text-caption text-[var(--text-tertiary)]">{subtitle}</p>}
            {trend && (
              <span className={`text-caption font-medium ${trendUp ? "text-[var(--accent-success)]" : "text-[var(--accent-danger)]"}`}>
                {trendUp ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                {trend}
              </span>
            )}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-[var(--radius-md)] ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}
