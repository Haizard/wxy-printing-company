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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/catalog", icon: Layers, label: "Catalog" },
  { to: "/calculator", icon: Calculator, label: "Calculator" },
  { to: "/quotes", icon: FileText, label: "Quotes" },
  { to: "/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/jobs", icon: ClipboardList, label: "Jobs" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

const bottomNavItems = [
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 material-thick border-r border-[var(--glass-border)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] flex items-center justify-center shadow-[0_2px_12px_rgba(255,90,60,0.3)]">
          <span className="text-white font-bold text-lg">P</span>
        </div>
        <div>
          <h1 className="text-headline font-semibold text-[var(--text-primary)]">
            PrintHub
          </h1>
          <p className="text-caption text-[var(--text-tertiary)]">OS v1.0</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
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

      {/* Bottom nav */}
      <div className="px-3 py-3 border-t border-[rgba(60,60,67,0.15)]">
        {bottomNavItems.map((item) => (
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
      </div>
    </aside>
  );
}
