import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminOnlyRoute from "./components/common/AdminOnlyRoute";
import BottomNav from "./components/common/BottomNav";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import OtpApprovals from "./pages/OtpApprovals";
import Dashboard from "./pages/Dashboard";
import Farmers from "./pages/Farmers";
import FarmerProfile from "./pages/FarmerProfile";
import AddService from "./pages/AddService";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import AddUser from "./pages/AddUser";
import StaffPerformance from "./pages/StaffPerformance";
import StatementPage from "./pages/StatementPage";
import Expenses from "./pages/Expenses";

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      {children}
      <BottomNav />
    </ProtectedRoute>
  );
}

function AdminProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <AdminOnlyRoute>{children}</AdminOnlyRoute>
      <BottomNav />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* PUBLIC: Statement link shared via reminder message — no login required */}
          <Route path="/statement/:slugId" element={<StatementPage />} />

          <Route
            path="/"
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            }
          />

          <Route
            path="/farmers"
            element={
              <ProtectedLayout>
                <Farmers />
              </ProtectedLayout>
            }
          />

          <Route
            path="/farmers/:id"
            element={
              <ProtectedLayout>
                <FarmerProfile />
              </ProtectedLayout>
            }
          />

          <Route
            path="/add-service"
            element={
              <ProtectedLayout>
                <AddService />
              </ProtectedLayout>
            }
          />

          {/* Staff attempting to reach /payments directly gets redirected */}
          <Route
            path="/payments"
            element={
              <AdminProtectedLayout>
                <Payments />
              </AdminProtectedLayout>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedLayout>
                <Profile />
              </ProtectedLayout>
            }
          />

          <Route
            path="/add-user"
            element={
              <ProtectedLayout>
                <AddUser />
              </ProtectedLayout>
            }
          />

          <Route
            path="/staff-performance"
            element={
              <ProtectedLayout>
                <StaffPerformance />
              </ProtectedLayout>
            }
          />

          <Route
            path="/otp-approvals"
            element={
              <ProtectedLayout>
                <OtpApprovals />
              </ProtectedLayout>
            }
          />

          {/* Staff attempting to reach /expenses directly gets redirected */}
          <Route
            path="/expenses"
            element={
              <AdminProtectedLayout>
                <Expenses />
              </AdminProtectedLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}