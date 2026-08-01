import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function AdminOnlyRoute({ children }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}