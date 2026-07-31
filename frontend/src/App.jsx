import {BrowserRouter,Routes,Route,} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
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

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      {children}
      <BottomNav />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          {/* PUBLIC: Statement link shared via reminder message — no login required */}
          <Route
            path="/statement/:slugId"
            element={<StatementPage />}
          />

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

          <Route
            path="/payments"
            element={
              <ProtectedLayout>
                <Payments />
              </ProtectedLayout>
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

          {/* NEW: Admin OTP Approvals */}
          <Route
            path="/otp-approvals"
            element={
              <ProtectedLayout>
                <OtpApprovals />
              </ProtectedLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}