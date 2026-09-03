import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Everyone who is NOT a plain customer works on the platform (admin panel).
export const STAFF_ROLES = ["admin", "sales", "production", "inventory_manager"];
// The client-side area is reserved for registered customers only.
export const CUSTOMER_ROLE = "customer";

const roleHierarchy: Record<string, string[]> = {
  admin: ["admin", "sales", "production", "inventory_manager", "customer"],
  sales: ["sales", "customer"],
  production: ["production", "customer"],
  inventory_manager: ["inventory_manager", "customer"],
  customer: ["customer"],
};

export function RequireAuth({
  children,
  allowedRoles,
  redirectTo,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = roleHierarchy[user.role] || [user.role];
    const hasAccess = allowedRoles.some((r) => userRoles.includes(r));

    if (!hasAccess) {
      // Clients must never land inside the staff/admin panel — send them to
      // their own area instead of showing them internal pages.
      if (user.role === CUSTOMER_ROLE) {
        return <Navigate to={redirectTo || "/client"} replace />;
      }
      // Staff hitting a page reserved for another staff role (or the client
      // area): explain, and offer a way out.
      const isClientArea = allowedRoles.includes(CUSTOMER_ROLE);
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center glass-card-strong p-8 rounded-[var(--radius-lg)] max-w-md">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-title-2 font-bold mb-2">Access Denied</h2>
            <p className="text-body text-[var(--text-secondary)] mb-4">
              {isClientArea
                ? "This area is for registered clients. Staff members use the dashboard instead."
                : "You don't have permission to view this page."}
            </p>
            <a
              href={isClientArea ? "/dashboard" : "/products"}
              className="inline-flex items-center justify-center h-10 px-5 rounded-pill bg-[var(--accent-primary)] text-white text-subhead font-semibold hover:opacity-90 transition-opacity"
            >
              {isClientArea ? "Go to dashboard" : "Back to products"}
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
