import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  Truck,
  Receipt,
  ChevronDown,
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

interface NavGroup {
  id: string;
  label: string;
  icon: any;
  allowedRoles?: UserRole[];
  items: NavItem[];
}

// ── Top-level items (no children) ─────────────────────────────────────────
const topItems: NavItem[] = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/catalog", icon: Layers, label: "Catalog", allowedRoles: ["admin", "sales"] },
  { to: "/calculator", icon: Calculator, label: "Calculator", allowedRoles: ["admin", "sales"] },
  { to: "/quotes", icon: FileText, label: "Quotes", allowedRoles: ["admin", "sales"] },
  { to: "/orders", icon: ShoppingCart, label: "Orders", allowedRoles: ["admin", "sales"] },
  { to: "/jobs", icon: ClipboardList, label: "Jobs" },
  { to: "/projects", icon: FolderOpen, label: "Projects" },
];

// ── Grouped sections ──────────────────────────────────────────────────────
const navGroups: NavGroup[] = [
  {
    id: "inventory",
    label: "Inventory",
    icon: Package,
    allowedRoles: ["admin", "inventory_manager"],
    items: [
      { to: "/inventory", icon: Package, label: "Stock Overview" },
      { to: "/suppliers", icon: Truck, label: "Suppliers" },
      { to: "/purchase-orders", icon: Receipt, label: "Purchase Orders" },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: MessageCircle,
    items: [
      { to: "/chat", icon: MessageCircle, label: "Chat" },
      { to: "/messages", icon: Mail, label: "Contact Messages", allowedRoles: ["admin"] },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    items: [
      { to: "/reports", icon: BarChart3, label: "Reports", allowedRoles: ["admin", "sales"] },
      { to: "/price-rules", icon: DollarSign, label: "Price Rules", allowedRoles: ["admin"] },
      { to: "/signage-configs", icon: Settings, label: "Signage Configs", allowedRoles: ["admin"] },
      { to: "/signage-materials", icon: Package, label: "Signage Materials", allowedRoles: ["admin"] },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    icon: Users,
    allowedRoles: ["admin"],
    items: [
      { to: "/users", icon: Users, label: "Users" },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  { to: "/settings", icon: Settings, label: "Settings" },
];

function canSee(item: NavItem | NavGroup, role?: string): boolean {
  if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
  return item.allowedRoles.includes(role as UserRole);
}

function SidebarLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-subhead font-medium transition-all duration-200",
          depth > 0 && "pl-9 text-[15px]",
          isActive
            ? "bg-[rgba(255,90,60,0.12)] text-[var(--accent-primary)]"
            : "text-[var(--text-secondary)] hover:bg-[rgba(255,90,60,0.06)] hover:text-[var(--text-primary)]",
        )
      }
    >
      <item.icon className={cn("flex-shrink-0", depth > 0 ? "w-4 h-4" : "w-5 h-5")} />
      <span>{item.label}</span>
    </NavLink>
  );
}

function CollapsibleGroup({
  group,
  role,
}: {
  group: NavGroup;
  role?: string;
}) {
  const location = useLocation();
  const hasActiveChild = group.items.some((item) => location.pathname === item.to || location.pathname.startsWith(item.to + "/"));
  const [open, setOpen] = useState(hasActiveChild);

  // Auto-expand when a child becomes active
  useEffect(() => {
    if (hasActiveChild && !open) setOpen(true);
  }, [hasActiveChild]);

  if (!canSee(group, role)) return null;
  const visibleChildren = group.items.filter((item) => canSee(item, role));
  if (visibleChildren.length === 0) return null;

  return (
    <div>
      {/* Group header — click to expand/collapse */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-subhead font-medium transition-all duration-200 w-full text-left",
          hasActiveChild
            ? "text-[var(--accent-primary)]"
            : "text-[var(--text-secondary)] hover:bg-[rgba(255,90,60,0.06)] hover:text-[var(--text-primary)]",
        )}
      >
        <group.icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{group.label}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
      </button>

      {/* Children */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="ml-2 pl-3 border-l border-[rgba(255,90,60,0.15)] space-y-0.5 mt-0.5 mb-1">
          {visibleChildren.map((item) => (
            <SidebarLink key={item.to} item={item} depth={1} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { user: currentUser, logout } = useAuth();
  const role = currentUser?.role;

  const visibleTopItems = topItems.filter((item) => canSee(item, role));
  const visibleBottom = bottomNavItems.filter((item) => canSee(item, role));

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 material-thick border-r border-[var(--glass-border)] overflow-hidden">
      {/* Logo */}
      <div className="flex items-center px-5 py-5">
        <img src="/wxy-logo.svg" alt="WXY" className="h-10 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Top-level items */}
        {visibleTopItems.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}

        {/* Divider */}
        <div className="!my-2 border-t border-[rgba(60,60,67,0.12)]" />

        {/* Grouped sections */}
        {navGroups.map((group) => (
          <CollapsibleGroup key={group.id} group={group} role={role} />
        ))}
      </nav>

      {/* Bottom nav + Sign Out */}
      <div className="px-3 py-3 border-t border-[rgba(60,60,67,0.15)] space-y-1">
        {visibleBottom.map((item) => (
          <SidebarLink key={item.to} item={item} />
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
