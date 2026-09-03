import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site-content";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/products", label: "Products" },
  { to: "/our-work", label: "Our Work" },
  { to: "/contact", label: "Contact" },
];

export function PublicNavbar() {
  return (
    <nav className="glass-chrome border-b border-[var(--glass-border)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/wxy-logo.svg" alt={SITE.logoAlt} className="h-10 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-pill text-subhead font-medium transition-colors",
                  isActive
                    ? "bg-[rgba(255,90,60,0.12)] text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[rgba(255,90,60,0.06)] hover:text-[var(--accent-primary)]",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="sm">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function PublicFooter() {
  return (
    <footer className="glass-chrome border-t border-[var(--glass-border)] px-4 lg:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
          <div className="flex items-center gap-3">
            <img src="/wxy-logo.svg" alt={SITE.logoAlt} className="h-9 w-auto" />
            <div>
              <p className="text-subhead font-semibold text-[var(--text-primary)]">{SITE.name}</p>
              <p className="text-caption text-[var(--text-tertiary)]">
                {SITE.tagline}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-caption text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-caption flex items-center gap-2 text-[var(--text-secondary)]">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              {SITE.contact.location}
            </p>
            <p className="text-caption flex items-center gap-2 text-[var(--text-secondary)]">
              <Phone className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              {SITE.contact.phone}
            </p>
            <p className="text-caption flex items-center gap-2 text-[var(--text-secondary)]">
              <Mail className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              {SITE.contact.email}
            </p>
          </div>
        </div>
        <div className="border-t border-[rgba(60,60,67,0.12)] mt-8 pt-5 text-center">
          <p className="text-caption text-[var(--text-tertiary)]">
            © {SITE.copyrightYear} {SITE.name}. {SITE.tagline}.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
