import { NavLink } from "react-router-dom";
import { Home, Layers, Calculator, ClipboardList, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/catalog", icon: Layers, label: "Catalog" },
  { to: "/calculator", icon: Calculator, label: "Calculate" },
  { to: "/jobs", icon: ClipboardList, label: "Jobs" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
];

export function MobileTabBar() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 material-chrome border-t border-[var(--glass-border)] safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => (
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
      </div>
    </nav>
  );
}
