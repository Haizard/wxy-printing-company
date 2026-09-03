import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, CreditCard, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTZS } from "@/lib/utils";
import { useOrders } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusConfig: Record<string, { color: "default" | "secondary" | "success" | "warning" | "danger"; label: string; icon: any }> = {
  pending: { color: "secondary", label: "Pending", icon: Clock },
  paid: { color: "success", label: "Paid", icon: CheckCircle },
  partially_paid: { color: "warning", label: "Partial", icon: CreditCard },
  cancelled: { color: "danger", label: "Cancelled", icon: XCircle },
};

export default function OrdersPage() {
  const { data: orders, loading, refetch } = useOrders();
  const { toast } = useToast();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateOrderStatus = async (orderId: string, status: string, paymentMethod?: string) => {
    setUpdatingId(orderId);
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, paymentMethod }),
      });
      if (response.ok) {
        toast({ title: "Order updated", description: `Order marked as ${status}`, variant: "success" });
        refetch();
      } else {
        const err = await response.json();
        toast({ title: "Error", description: err.error || "Failed to update order", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast({ title: "Order deleted", variant: "success" });
        refetch();
      } else {
        const err = await response.json();
        toast({ title: "Failed to delete", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete order", variant: "destructive" });
    }
  };

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

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />
          ))}
        </div>
      ) : (orders || []).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-subhead text-[var(--text-tertiary)]">
              No orders yet. Create one from the calculator or cart.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(orders || []).map((order: any, index: number) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const isExpanded = expandedOrder === order.id;
            const Icon = config.icon;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order header row */}
                    <div
                      className="flex items-center justify-between p-5 cursor-pointer hover:bg-[rgba(255,90,60,0.02)] transition-colors"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--bg-gradient-1)] to-[var(--bg-gradient-2)] flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[var(--accent-primary)]" />
                        </div>
                        <div>
                          <p className="text-headline font-semibold">{order.orderNumber}</p>
                          <p className="text-caption text-[var(--text-tertiary)]">
                            {new Date(order.createdAt).toLocaleDateString("en-TZ", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge variant={config.color}>{config.label}</Badge>
                        <span className="text-headline font-bold text-[var(--accent-primary)]">
                          {formatTZS(order.total)}
                        </span>
                        <div className="flex items-center gap-1 text-caption text-[var(--text-tertiary)]">
                          <CreditCard className="w-3 h-3" />
                          {order.paymentMethod || "Cash"}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--text-tertiary)] hover:text-red-500"
                          onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[rgba(60,60,67,0.15)] p-5"
                      >
                        {/* Requested items / notes (client order requests) */}
                        {((Array.isArray(order.items) && order.items.length > 0) ||
                          order.notes ||
                          order.customerName) && (
                          <div className="mb-5 space-y-3">
                            {Array.isArray(order.items) && order.items.length > 0 && (
                              <div>
                                <p className="text-caption text-[var(--text-tertiary)] mb-1">
                                  Requested items
                                </p>
                                <div className="space-y-1">
                                  {order.items.map((item: any, i: number) => (
                                    <p
                                      key={i}
                                      className="text-subhead font-medium flex items-center justify-between gap-3"
                                    >
                                      <span>{item.name}</span>
                                      <span className="text-caption text-[var(--text-tertiary)]">
                                        {item.quantity} ×{" "}
                                        {item.price > 0
                                          ? formatTZS(item.price)
                                          : "unpriced (awaiting quote)"}
                                      </span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                            {order.customerName && (
                              <p className="text-caption text-[var(--text-secondary)]">
                                Customer:{" "}
                                <span className="font-semibold">
                                  {order.customerName}
                                </span>
                              </p>
                            )}
                            {order.notes && (
                              <p className="text-caption text-[var(--text-secondary)] bg-[var(--glass-fill-subtle)] rounded-[var(--radius-sm)] px-3 py-2">
                                {order.notes}
                              </p>
                            )}
                            {order.total === 0 &&
                              Array.isArray(order.items) &&
                              order.items.length > 0 && (
                                <p className="text-caption font-medium text-[var(--accent-warning)]">
                                  Client request — confirm specs &amp; price with
                                  the customer (use the Calculator to quote), then
                                  update this order.
                                </p>
                              )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                          <div>
                            <p className="text-caption text-[var(--text-tertiary)]">Order Total</p>
                            <p className="text-headline font-bold">{formatTZS(order.total)}</p>
                          </div>
                          <div>
                            <p className="text-caption text-[var(--text-tertiary)]">Payment Method</p>
                            <p className="text-subhead font-medium capitalize">{order.paymentMethod || "Cash"}</p>
                          </div>
                          <div>
                            <p className="text-caption text-[var(--text-tertiary)]">Created</p>
                            <p className="text-subhead font-medium">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-caption text-[var(--text-tertiary)]">Status</p>
                            <Badge variant={config.color}>{config.label}</Badge>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-subhead font-medium text-[var(--text-secondary)]">
                            Actions:
                          </span>
                          {order.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, "paid")}
                                disabled={updatingId === order.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Mark as Paid
                              </Button>
                              <Select
                                onValueChange={(val) => updateOrderStatus(order.id, val)}
                                disabled={updatingId === order.id}
                              >
                                <SelectTrigger className="w-[160px] h-8">
                                  <SelectValue placeholder="Change status..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                                  <SelectItem value="cancelled">Cancel Order</SelectItem>
                                </SelectContent>
                              </Select>
                            </>
                          )}
                          {order.status === "partially_paid" && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "paid")}
                              disabled={updatingId === order.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark Fully Paid
                            </Button>
                          )}
                          {order.status === "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, "pending")}
                              disabled={updatingId === order.id}
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              Reopen Order
                            </Button>
                          )}
                          {order.status === "paid" && (
                            <p className="text-caption text-green-600 font-medium">
                              ✓ Payment complete — no further actions needed.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
