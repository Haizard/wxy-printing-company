import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Home,
  LogOut,
  MessageCircle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { SITE } from "@/lib/site-content";

const clientLinks = [
  { to: "/client", icon: Home, label: "Dashboard" },
  { to: "/client/orders", icon: ClipboardList, label: "My Requests" },
  { to: "/client/chat", icon: MessageCircle, label: "Chat with Us" },
];

export function CustomerShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Client top bar — no admin panel, only the shop + client services */}
      <nav className="glass-chrome border-b border-[var(--glass-border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src="/wxy-logo.svg" alt={SITE.logoAlt} className="h-10 w-auto" />
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            {clientLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3 py-2 rounded-pill text-subhead font-medium transition-colors",
                    isActive
                      ? "bg-[rgba(255,90,60,0.12)] text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[rgba(255,90,60,0.06)] hover:text-[var(--accent-primary)]",
                  )
                }
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/products"
              className="flex items-center gap-2 px-3 py-2 rounded-pill text-subhead font-medium text-[var(--text-secondary)] hover:bg-[rgba(255,90,60,0.06)] hover:text-[var(--accent-primary)] transition-colors"
            >
              <Package className="w-4 h-4" />
              Browse Products
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-pill glass-card-subtle">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] flex items-center justify-center">
                <span className="text-white text-caption font-bold">
                  {(user?.fullName || "C").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="leading-tight">
                <p className="text-caption font-semibold text-[var(--text-primary)] max-w-[130px] truncate">
                  {user?.fullName}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Client account</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1.5">Sign out</span>
            </Button>
          </div>
        </div>

        {/* Mobile client links */}
        <div className="sm:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {clientLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-caption font-medium whitespace-nowrap",
                  isActive
                    ? "bg-[rgba(255,90,60,0.12)] text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)]",
                )
              }
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/products"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-caption font-medium text-[var(--text-secondary)] whitespace-nowrap"
          >
            <Package className="w-3.5 h-3.5" />
            Browse Products
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-8 py-8 pb-16">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--glass-border)] px-4 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-caption text-[var(--text-tertiary)]">
          <p>
            © {SITE.copyrightYear} {SITE.name}. {SITE.tagline}.
          </p>
          <p>
            Need a hand?{" "}
            <Link to="/client/chat" className="text-[var(--accent-primary)] hover:underline">
              Chat with our team
            </Link>{" "}
            · {SITE.contact.phone}
          </p>
        </div>
      </footer>
    </div>
  );
}
