import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import ProtectedRoute, { AdminRoute } from "./components/layout/ProtectedRoute.jsx";

import LoginPage from "./features/auth/LoginPage.jsx";
import DashboardPage from "./features/dashboard/DashboardPage.jsx";
import SalesListPage from "./features/sales/SalesListPage.jsx";
import SaleFormPage from "./features/sales/SaleFormPage.jsx";
import SaleDetailsPage from "./features/sales/SaleDetailsPage.jsx";
import PendingPaymentsPage from "./features/sales/PendingPaymentsPage.jsx";
import CustomersPage from "./features/customers/CustomersPage.jsx";
import CustomerDetailsPage from "./features/customers/CustomerDetailsPage.jsx";
import ProductsPage from "./features/products/ProductsPage.jsx";
import ReportsPage from "./features/reports/ReportsPage.jsx";
import TrashPage from "./features/trash/TrashPage.jsx";
import MorePage from "./features/more/MorePage.jsx";
import SettingsPage from "./features/more/SettingsPage.jsx";
import ProfilePage from "./features/more/ProfilePage.jsx";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <HashRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/sales" element={<SalesListPage />} />
                <Route path="/sales/new" element={<SaleFormPage mode="create" />} />
                <Route path="/sales/pending" element={<PendingPaymentsPage />} />
                <Route path="/sales/:id" element={<SaleDetailsPage />} />
                <Route path="/sales/:id/edit" element={<SaleFormPage mode="edit" />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id" element={<CustomerDetailsPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route
                  path="/trash"
                  element={
                    <AdminRoute>
                      <TrashPage />
                    </AdminRoute>
                  }
                />
                <Route path="/more" element={<MorePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
