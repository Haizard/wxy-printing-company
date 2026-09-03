import { NavLink } from "react-router-dom";
import {
  Home,
  Calculator,
  ShoppingCart,
  ClipboardList,
  Package,
  MessageCircle,
  BarChart3,
  Settings,
  Layers,
  FileText,
  DollarSign,
  FolderOpen,
  Mail,
  LogOut,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "admin" | "sales" | "production" | "inventory_manager" | "customer";

interface NavItem {
  to: string;
  icon: any;
  label: string;
  /** If set, only these roles see this item. Empty/missing = all staff roles. */
  allowedRoles?: UserRole[];
}

const navItems: NavItem[] = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/catalog", icon: Layers, label: "Catalog", allowedRoles: ["admin", "sales"] },
  { to: "/calculator", icon: Calculator, label: "Calculator", allowedRoles: ["admin", "sales"] },
  { to: "/quotes", icon: FileText, label: "Quotes", allowedRoles: ["admin", "sales"] },
  { to: "/orders", icon: ShoppingCart, label: "Orders", allowedRoles: ["admin", "sales"] },
  { to: "/jobs", icon: ClipboardList, label: "Jobs" },
  { to: "/inventory", icon: Package, label: "Inventory", allowedRoles: ["admin", "inventory_manager"] },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/reports", icon: BarChart3, label: "Reports", allowedRoles: ["admin", "sales"] },
  { to: "/price-rules", icon: DollarSign, label: "Price Rules", allowedRoles: ["admin"] },
  { to: "/projects", icon: FolderOpen, label: "Projects" },
  { to: "/messages", icon: Mail, label: "Contact Messages", allowedRoles: ["admin"] },
  { to: "/users", icon: Users, label: "Users", allowedRoles: ["admin"] },
];

const bottomNavItems: NavItem[] = [
  { to: "/settings", icon: Settings, label: "Settings" },
];

function canSee(item: NavItem, role?: string): boolean {
  if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
  return item.allowedRoles.includes(role as UserRole);
}

export function Sidebar() {
  const { user: currentUser, logout } = useAuth();
  const role = currentUser?.role;

  const visibleItems = navItems.filter((item) => canSee(item, role));
  const visibleBottom = bottomNavItems.filter((item) => canSee(item, role));

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 material-thick border-r border-[var(--glass-border)] overflow-hidden">
      {/* Logo */}
      <div className="flex items-center px-5 py-5">
        <img src="/wxy-logo.svg" alt="WXY" className="h-10 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto overflow-x-hidden min-h-0">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-subhead font-medium transition-all duration-200",
                isActive
                  ? "bg-[rgba(255,90,60,0.12)] text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[rgba(255,90,60,0.06)] hover:text-[var(--text-primary)]",
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom nav + Sign Out */}
      <div className="px-3 py-3 border-t border-[rgba(60,60,67,0.15)] space-y-1">
        {visibleBottom.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-subhead font-medium transition-all duration-200",
                isActive
                  ? "bg-[rgba(255,90,60,0.12)] text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[rgba(255,90,60,0.06)] hover:text-[var(--text-primary)]",
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-subhead font-medium transition-all duration-200 w-full text-[var(--text-secondary)] hover:bg-[rgba(255,59,48,0.08)] hover:text-[var(--accent-danger)]"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
