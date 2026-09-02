import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTZS } from "@/lib/utils";

const revenueData = [
  { category: "Large Format", amount: 4500000, change: 12 },
  { category: "Digital Printing", amount: 3200000, change: 8 },
  { category: "Signage", amount: 2800000, change: -3 },
  { category: "Design Services", amount: 1500000, change: 25 },
  { category: "Photo & Canvas", amount: 1200000, change: 5 },
];

const jobStats = [
  { status: "Completed", count: 45, color: "bg-[var(--accent-success)]" },
  { status: "In Production", count: 12, color: "bg-[var(--accent-warning)]" },
  { status: "Confirmed", count: 8, color: "bg-[var(--accent-tertiary)]" },
  { status: "Delivered", count: 38, color: "bg-[var(--text-tertiary)]" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Reports</h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Revenue, performance, and business insights
        </p>
      </motion.div>

      {/* Revenue by category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
            Revenue by Category (This Month)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueData.map((item, index) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="flex items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-subhead font-medium">{item.category}</span>
                    <span className="text-subhead font-semibold">{formatTZS(item.amount)}</span>
                  </div>
                  <div className="h-2 rounded-pill bg-[var(--glass-fill-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-pill bg-gradient-to-r from-[var(--accent-primary)] to-[#E84530] transition-all duration-700"
                      style={{
                        width: `${(item.amount / revenueData[0].amount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-caption font-medium ${
                  item.change >= 0 ? "text-[var(--accent-success)]" : "text-[var(--accent-danger)]"
                }`}>
                  {item.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {item.change >= 0 ? "+" : ""}{item.change}%
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job throughput */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[var(--accent-secondary)]" />
              Job Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobStats.map((stat, index) => (
                <motion.div
                  key={stat.status}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                  <span className="text-subhead flex-1">{stat.status}</span>
                  <span className="text-headline font-bold">{stat.count}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-subhead text-[var(--text-secondary)]">Avg. Quote to Order</span>
              <span className="text-headline font-semibold">2.3 days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-subhead text-[var(--text-secondary)]">Avg. Production Time</span>
              <span className="text-headline font-semibold">4.1 days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-subhead text-[var(--text-secondary)]">Customer Satisfaction</span>
              <span className="text-headline font-semibold">4.8/5.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-subhead text-[var(--text-secondary)]">Repeat Customer Rate</span>
              <span className="text-headline font-semibold">67%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
