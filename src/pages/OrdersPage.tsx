import { motion } from "framer-motion";
import { ShoppingCart, CreditCard, Clock, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTZS } from "@/lib/utils";

interface Order {
  id: string;
  number: string;
  customer: string;
  items: string[];
  total: number;
  status: "pending" | "paid" | "partially_paid" | "cancelled";
  paymentMethod: string;
  createdAt: string;
}

const orders: Order[] = [
  { id: "o1", number: "ORD-2026-0001", customer: "Green Valley School", items: ["Company Profile", "ID Cards"], total: 1200000, status: "paid", paymentMethod: "Invoice", createdAt: "Today" },
  { id: "o2", number: "ORD-2026-0002", customer: "Acme Corp", items: ["Roll-up Banner", "Business Cards"], total: 320000, status: "pending", paymentMethod: "Cash on Delivery", createdAt: "Today" },
  { id: "o3", number: "ORD-2026-0003", customer: "Tech Solutions", items: ["A3 Posters", "Flyers"], total: 850000, status: "partially_paid", paymentMethod: "Invoice", createdAt: "Yesterday" },
];

const statusConfig = {
  pending: { color: "secondary" as const, label: "Pending" },
  paid: { color: "success" as const, label: "Paid" },
  partially_paid: { color: "warning" as const, label: "Partial" },
  cancelled: { color: "danger" as const, label: "Cancelled" },
};

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Orders</h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Track customer orders and payments
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="cursor-pointer hover:shadow-[var(--glass-shadow)] transition-all duration-200 hover:scale-[0.98]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-headline font-semibold">{order.number}</p>
                    <p className="text-caption text-[var(--text-tertiary)]">{order.customer}</p>
                  </div>
                  <Badge variant={statusConfig[order.status].color}>
                    {statusConfig[order.status].label}
                  </Badge>
                </div>

                <div className="space-y-1 mb-4">
                  {order.items.map((item, i) => (
                    <p key={i} className="text-caption text-[var(--text-secondary)] truncate">
                      • {item}
                    </p>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[rgba(60,60,67,0.15)]">
                  <span className="text-headline font-bold text-[var(--accent-primary)]">
                    {formatTZS(order.total)}
                  </span>
                  <div className="flex items-center gap-1 text-caption text-[var(--text-tertiary)]">
                    <CreditCard className="w-3 h-3" />
                    {order.paymentMethod}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
