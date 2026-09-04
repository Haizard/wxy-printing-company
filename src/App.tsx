import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from "@/components/layout/AppLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import { RequireAuth, STAFF_ROLES, CUSTOMER_ROLE } from "@/components/RequireAuth";
import { CustomerShell } from "@/components/layout/CustomerShell";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import CatalogPage from "@/pages/CatalogPage";
import CalculatorPage from "@/pages/CalculatorPage";
import JobsPage from "@/pages/JobsPage";
import QuotesPage from "@/pages/QuotesPage";
import OrdersPage from "@/pages/OrdersPage";
import InventoryPage from "@/pages/InventoryPage";
import ChatPage from "@/pages/ChatPage";
import ReportsPage from "@/pages/ReportsPage";
import SignageMaterialsPage from "@/pages/SignageMaterialsPage";
import SettingsPage from "@/pages/SettingsPage";
import CartPage from "@/pages/CartPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import UsersPage from "@/pages/UsersPage";
import PriceRulesPage from "@/pages/PriceRulesPage";
import ProjectsPage from "@/pages/ProjectsPage";
import AboutPage from "@/pages/AboutPage";
import ProductsPage from "@/pages/ProductsPage";
import OurWorkPage from "@/pages/OurWorkPage";
import ContactPage from "@/pages/ContactPage";
import ContactMessagesPage from "@/pages/ContactMessagesPage";
import ClientOrdersPage from "@/pages/ClientOrdersPage";
import ClientDashboardPage from "@/pages/ClientDashboardPage";
import SuppliersPage from "@/pages/SuppliersPage";
import PurchaseOrdersPage from "@/pages/PurchaseOrdersPage";

export default function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<PublicLayout />}>
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/our-work" element={<OurWorkPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Staff / platform routes (admin panel — customers never see this) */}
        <Route
          element={
            <RequireAuth allowedRoles={STAFF_ROLES}>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:categoryName" element={<ProductDetailPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/calculator/:categorySlug" element={<CalculatorPage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/inventory" element={<RequireAuth allowedRoles={["admin", "inventory_manager", "production"]}><InventoryPage /></RequireAuth>} />
          <Route path="/chat" element={<ChatPage />} />
          
            <Route path="/signage-materials" element={<RequireAuth allowedRoles={["admin"]}><SignageMaterialsPage /></RequireAuth>} />
<Route path="/reports" element={<RequireAuth allowedRoles={["admin", "sales"]}><ReportsPage /></RequireAuth>} />
          <Route path="/price-rules" element={<RequireAuth allowedRoles={["admin"]}><PriceRulesPage /></RequireAuth>} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/users" element={<RequireAuth allowedRoles={["admin"]}><UsersPage /></RequireAuth>} />
          <Route path="/messages" element={<RequireAuth allowedRoles={["admin"]}><ContactMessagesPage /></RequireAuth>} />
          <Route path="/suppliers" element={<RequireAuth allowedRoles={["admin", "inventory_manager"]}><SuppliersPage /></RequireAuth>} />
          <Route path="/purchase-orders" element={<RequireAuth allowedRoles={["admin", "inventory_manager"]}><PurchaseOrdersPage /></RequireAuth>} />
        </Route>

        {/* Client area — only for registered customers, no admin panel access */}
        <Route
          element={
            <RequireAuth allowedRoles={[CUSTOMER_ROLE]}>
              <CustomerShell />
            </RequireAuth>
          }
        >
          <Route path="/client" element={<ClientDashboardPage />} />
          <Route path="/client/orders" element={<ClientOrdersPage />} />
          <Route path="/client/chat" element={<ChatPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
