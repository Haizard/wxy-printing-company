import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
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

  // Check role if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = roleHierarchy[user.role] || [user.role];
    const hasAccess = allowedRoles.some((r) => userRoles.includes(r));
    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center glass-card-strong p-8 rounded-[var(--radius-lg)] max-w-md">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-title-2 font-bold mb-2">Access Denied</h2>
            <p className="text-body text-[var(--text-secondary)] mb-4">
              You don't have permission to view this page.
            </p>
            <p className="text-caption text-[var(--text-tertiary)]">
              Required: {allowedRoles.join(" or ")} &middot; Your role: {user.role}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
