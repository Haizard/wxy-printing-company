import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Layers,
  Calculator,
  ClipboardList,
  MessageCircle,
  ShoppingCart,
  Package,
  BarChart3,
  DollarSign,
  FolderOpen,
  Mail,
  Users,
  Settings,
  MoreHorizontal,
  X,
  LogOut,
  Truck,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "admin" | "sales" | "production" | "inventory_manager" | "customer";

interface NavItem {
  to: string;
  icon: any;
  label: string;
  allowedRoles?: UserRole[];
}

const primaryTabs: NavItem[] = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/catalog", icon: Layers, label: "Catalog" },
  { to: "/calculator", icon: Calculator, label: "Calculate" },
  { to: "/jobs", icon: ClipboardList, label: "Jobs" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
];

const moreItems: NavItem[] = [
  { to: "/orders", icon: ShoppingCart, label: "Orders", allowedRoles: ["admin", "sales"] },
  { to: "/inventory", icon: Package, label: "Inventory", allowedRoles: ["admin", "inventory_manager"] },
  { to: "/suppliers", icon: Truck, label: "Suppliers", allowedRoles: ["admin", "inventory_manager"] },
  { to: "/purchase-orders", icon: Receipt, label: "Purchase Orders", allowedRoles: ["admin", "inventory_manager"] },
  { to: "/quotes", icon: Layers, label: "Quotes", allowedRoles: ["admin", "sales"] },
  { to: "/reports", icon: BarChart3, label: "Reports", allowedRoles: ["admin", "sales"] },
  { to: "/price-rules", icon: DollarSign, label: "Price Rules", allowedRoles: ["admin"] },
  { to: "/projects", icon: FolderOpen, label: "Projects" },
  { to: "/messages", icon: Mail, label: "Contact Messages", allowedRoles: ["admin"] },
  { to: "/users", icon: Users, label: "Users", allowedRoles: ["admin"] },
  { to: "/settings", icon: Settings, label: "Settings" },
];

function canSee(item: NavItem, role?: string): boolean {
  if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
  return item.allowedRoles.includes(role as UserRole);
}

export function MobileTabBar() {
  const [showMore, setShowMore] = useState(false);
  const { user, logout } = useAuth();
  const role = user?.role;

  const visibleMore = moreItems.filter((item) => canSee(item, role));

  return (
    <>
      {/* Main tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 material-chrome border-t border-[var(--glass-border)] safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {primaryTabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[var(--radius-md)] transition-all duration-200 min-w-[56px]",
                  isActive
                    ? "text-[var(--accent-primary)]"
                    : "text-[var(--text-tertiary)]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      "p-1 rounded-pill transition-all duration-200",
                      isActive && "bg-[rgba(255,90,60,0.12)]",
                    )}
                  >
                    <tab.icon className="w-5 h-5" />
                  </div>
                  <span className="text-caption font-medium">{tab.label}</span>
                </>
              )}
            </NavLink>
          ))}
          {/* More button */}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--text-tertiary)] transition-all duration-200 min-w-[56px]"
          >
            <div className="p-1 rounded-pill">
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-caption font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More menu overlay */}
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />
          {/* Slide-up panel */}
          <div className="absolute bottom-0 left-0 right-0 material-thick rounded-t-[var(--radius-lg)] border-t border-[var(--glass-border)] max-h-[75vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(60,60,67,0.15)] sticky top-0 bg-inherit">
              <p className="text-headline font-semibold text-text-primary">Menu</p>
              <button
                onClick={() => setShowMore(false)}
                className="p-1.5 rounded-full hover:bg-[rgba(255,255,255,0.3)]"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Navigation items */}
            <div className="px-3 py-2 space-y-0.5">
              {visibleMore.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-3 rounded-[var(--radius-md)] text-subhead font-medium transition-all duration-200",
                      isActive
                        ? "bg-[rgba(255,90,60,0.12)] text-[var(--accent-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[rgba(255,90,60,0.06)]",
                    )
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Sign out */}
            <div className="px-3 py-2 border-t border-[rgba(60,60,67,0.15)]">
              <button
                onClick={() => {
                  setShowMore(false);
                  logout();
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-[var(--radius-md)] text-subhead font-medium text-[var(--accent-danger)] hover:bg-[rgba(255,59,48,0.08)] w-full transition-all"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
