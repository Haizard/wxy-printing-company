import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  MessageCircle,
  Package,
  ArrowRight,
  CreditCard,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTZS } from "@/lib/utils";
import { useOrders, useFetch } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";

const statusConfig: Record<string, { color: "default" | "secondary" | "success" | "warning" | "danger"; label: string }> = {
  pending: { color: "secondary", label: "Requested" },
  paid: { color: "success", label: "Paid" },
  partially_paid: { color: "warning", label: "Partial payment" },
  cancelled: { color: "danger", label: "Cancelled" },
};

function timeAgo(value?: string | null) {
  if (!value) return "";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-TZ", { month: "short", day: "numeric" });
}

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: orders, loading: ordersLoading } = useOrders();
  const { data: threads, loading: threadsLoading } = useFetch<any[]>("/api/chat/threads-with-users");

  const recentRequests = useMemo(() => (orders || []).slice(0, 3), [orders]);
  const openRequests = useMemo(
    () => (orders || []).filter((o: any) => o.status === "pending"),
    [orders],
  );
  const recentThreads = useMemo(
    () =>
      (threads || [])
        .slice()
        .sort(
          (a: any, b: any) =>
            new Date(b.lastMessage?.createdAt || b.createdAt || 0).getTime() -
            new Date(a.lastMessage?.createdAt || a.createdAt || 0).getTime(),
        )
        .slice(0, 3),
    [threads],
  );

  const firstName = user?.fullName?.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Your client dashboard — track your requests and talk to our team.
        </p>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: "Total Requests",
            value: String(orders?.length || 0),
            icon: ClipboardList,
            color: "text-[var(--accent-tertiary)]",
            bg: "bg-[rgba(46,125,255,0.1)]",
            to: "/client/orders",
          },
          {
            title: "Awaiting Price",
            value: String(
              (orders || []).filter(
                (o: any) => o.status === "pending" && Array.isArray(o.items) && o.items.length > 0 && !o.total,
              ).length,
            ),
            icon: Clock,
            color: "text-[var(--accent-secondary)]",
            bg: "bg-[rgba(255,176,32,0.12)]",
            to: "/client/orders",
          },
          {
            title: "Conversations",
            value: String(threads?.length || 0),
            icon: MessageCircle,
            color: "text-[var(--accent-primary)]",
            bg: "bg-[rgba(255,90,60,0.1)]",
            to: "/client/chat",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
          >
            <Link to={stat.to}>
              <Card className="cursor-pointer hover:shadow-[var(--glass-shadow)] transition-all duration-200 hover:scale-[0.98]">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-caption text-[var(--text-secondary)]">{stat.title}</p>
                    <p className="text-title-2 font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-[var(--radius-md)] ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Requests</CardTitle>
              <Link to="/client/orders">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)] animate-pulse" />
                ))}
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart className="w-9 h-9 text-[var(--text-tertiary)] mx-auto mb-3" />
                <p className="text-subhead text-[var(--text-tertiary)]">No requests yet</p>
                <p className="text-caption text-[var(--text-tertiary)] mt-1 mb-4">
                  Browse our catalogue and place your first order request.
                </p>
                <Link to="/products">
                  <Button size="sm">
                    Browse products
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((order: any) => {
                  const config = statusConfig[order.status] || statusConfig.pending;
                  const firstItem = (order.items && order.items[0]) || {};
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[rgba(255,90,60,0.04)] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-subhead font-medium truncate">{order.orderNumber}</p>
                        <p className="text-caption text-[var(--text-tertiary)] truncate">
                          {firstItem.name || "Order request"}
                          {(order.items?.length || 0) > 1 ? ` +${order.items.length - 1} more` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant={config.color}>{config.label}</Badge>
                        {Array.isArray(order.items) && order.items.length > 0 && !order.total ? (
                          <span className="text-caption text-[var(--accent-secondary)] font-medium">Price pending</span>
                        ) : (
                          <span className="text-subhead font-semibold">{formatTZS(order.total)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent conversations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Conversations</CardTitle>
              <Link to="/client/chat">
                <Button variant="ghost" size="sm">
                  Open chat
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {threadsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)] animate-pulse" />
                ))}
              </div>
            ) : recentThreads.length === 0 ? (
              <div className="text-center py-10">
                <MessageCircle className="w-9 h-9 text-[var(--text-tertiary)] mx-auto mb-3" />
                <p className="text-subhead text-[var(--text-tertiary)]">No conversations yet</p>
                <p className="text-caption text-[var(--text-tertiary)] mt-1 mb-4">
                  Chat with our team about a product or a request.
                </p>
                <Button size="sm" onClick={() => navigate("/client/chat")}>
                  Start a chat
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentThreads.map((thread: any) => (
                  <button
                    key={thread.id}
                    onClick={() => navigate("/client/chat")}
                    className="w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)] text-left hover:bg-[rgba(255,90,60,0.04)] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-subhead font-medium truncate">
                        {thread.lastMessage?.body?.substring(0, 60) || "Customer Service"}
                      </p>
                      <p className="text-caption text-[var(--text-tertiary)] truncate">
                        {thread.messageCount || 0} message{(thread.messageCount || 0) !== 1 ? "s" : ""} · {timeAgo(thread.lastMessage?.createdAt || thread.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick help */}
      <Card variant="subtle">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[rgba(255,90,60,0.1)] flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="text-headline font-semibold text-[var(--text-primary)]">
                {openRequests.length > 0
                  ? `You have ${openRequests.length} request${openRequests.length > 1 ? "s" : ""} awaiting price confirmation`
                  : "Not sure what you need?"}
              </p>
              <p className="text-caption text-[var(--text-secondary)] mt-0.5">
                {openRequests.length > 0
                  ? "Our team will confirm the price shortly — chat with us to speed it up."
                  : "Browse products, place a request, or chat with our team first."}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" onClick={() => navigate("/client/chat")}>
              <MessageCircle className="w-4 h-4 mr-1.5" />
              Chat with us
            </Button>
            {openRequests.length > 0 ? (
              <Button variant="outline" onClick={() => navigate("/client/orders")}>
                <CreditCard className="w-4 h-4 mr-1.5" />
                My requests
              </Button>
            ) : (
              <Link to="/products">
                <Button>
                  Browse products
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
