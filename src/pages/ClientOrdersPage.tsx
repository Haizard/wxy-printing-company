import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  CreditCard,
  MessageCircle,
  Package,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTZS } from "@/lib/utils";
import { useOrders } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";

const statusConfig: Record<
  string,
  { color: "default" | "secondary" | "success" | "warning" | "danger"; label: string }
> = {
  pending: { color: "secondary", label: "Requested", },
  paid: { color: "success", label: "Paid", },
  partially_paid: { color: "warning", label: "Partial payment", },
  cancelled: { color: "danger", label: "Cancelled", },
};

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ClientOrdersPage() {
  const { data: orders, loading } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();

  const chatAbout = (order: any) => {
    const firstItem = (order.items && order.items[0]) || {};
    const params = new URLSearchParams({ open: "1" });
    if (firstItem.productId) params.set("product", firstItem.productId);
    if (firstItem.name) params.set("name", firstItem.name);
    params.set("order", order.orderNumber);
    navigate(`/client/chat?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">
          My Requests
        </h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Hi {user?.fullName?.split(" ")[0] || "there"} — track the orders you
          placed with us. Prices are confirmed by our team after you submit a
          request.
        </p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-48 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse"
            />
          ))}
        </div>
      ) : (orders || []).length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <ClipboardList className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-headline font-semibold text-[var(--text-secondary)] mb-1">
              You haven't placed any requests yet
            </p>
            <p className="text-caption text-[var(--text-tertiary)] mb-6">
              Browse our catalogue, tell us what you need, and we'll confirm
              your price.
            </p>
            <Link to="/products">
              <Button size="lg">
                Browse products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(orders || []).map((order: any, index: number) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const items: any[] = Array.isArray(order.items) ? order.items : [];
            const awaitingPricing = items.length > 0 && !order.total;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.05 }}
                className="h-full"
              >
                <Card className="h-full flex flex-col">
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-headline font-semibold text-[var(--text-primary)]">
                          {order.orderNumber}
                        </p>
                        <p className="text-caption text-[var(--text-tertiary)] mt-0.5">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <Badge variant={config.color}>{config.label}</Badge>
                    </div>

                    {/* Requested items */}
                    <div className="mt-4 space-y-2">
                      {items.length > 0 ? (
                        items.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-3 text-subhead"
                          >
                            <span className="text-[var(--text-secondary)]">
                              {item.name}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-caption text-[var(--text-tertiary)]">
                                × {item.quantity}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 text-subhead text-[var(--text-secondary)]">
                          <Package className="w-4 h-4" />
                          Order request
                        </div>
                      )}
                      {order.notes && (
                        <p className="text-caption text-[var(--text-tertiary)] bg-[var(--glass-fill-subtle)] rounded-[var(--radius-sm)] px-3 py-2">
                          {order.notes}
                        </p>
                      )}
                    </div>

                    {/* Price status */}
                    <div className="mt-4 pt-3 border-t border-[rgba(60,60,67,0.1)] flex items-center justify-between gap-2">
                      {awaitingPricing ? (
                        <p className="flex items-center gap-1.5 text-caption text-[var(--accent-secondary)] font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Awaiting price confirmation
                        </p>
                      ) : (
                        <p className="text-subhead text-[var(--text-secondary)]">
                          Total
                        </p>
                      )}
                      <p className="text-headline font-bold text-[var(--accent-primary)]">
                        {awaitingPricing ? "TSh —" : formatTZS(order.total)}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4 pt-1 mt-auto">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => chatAbout(order)}
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        Chat about this request
                      </Button>
                      {(order.status === "paid" ||
                        order.status === "partially_paid") && (
                        <Badge variant="secondary" className="self-center">
                          <CreditCard className="w-3 h-3 mr-1" />
                          {order.paymentMethod || "Cash"}
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

      <Card variant="subtle">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-headline font-semibold text-[var(--text-primary)]">
              Not sure what you need?
            </p>
            <p className="text-caption text-[var(--text-secondary)] mt-0.5">
              Chat with our customer service before placing a request — we'll
              help you choose and estimate.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/client/chat")}>
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Open chat
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
