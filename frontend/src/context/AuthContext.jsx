
import { createContext, useState, useEffect } from "react";
import { loginRequest } from "../api/authApi";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // NEW:
  // Stores information when staff needs new-device OTP approval.
  const [deviceApprovalRequired, setDeviceApprovalRequired] =
    useState(false);

  const [pendingLoginMobile, setPendingLoginMobile] =
    useState("");

  useEffect(() => {
    if (user) {
      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // NEW:
  // Create one permanent ID for this browser/device.
  // It stays in localStorage, so approved devices remain trusted.
  const getDeviceId = () => {
    let deviceId =
      localStorage.getItem("deviceId");

    if (!deviceId) {
      deviceId =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}`;

      localStorage.setItem(
        "deviceId",
        deviceId
      );
    }

    return deviceId;
  };

  const login = async (
    identifier,
    password
  ) => {
    setLoading(true);
    setError(null);

    try {
      const deviceId = getDeviceId();

      // Existing login request.
      // Only deviceId is additionally passed.
      const { data } = await loginRequest(
        identifier,
        password,
        deviceId
      );

      localStorage.setItem(
        "token",
        data.token
      );

      setUser(data);

      // Clear any previous approval state.
      setDeviceApprovalRequired(false);
      setPendingLoginMobile("");

      return true;
    } catch (err) {
      // NEW:
      // Backend returns this when staff uses
      // an unapproved/new device.
      if (
        err.response?.data
          ?.requiresDeviceApproval
      ) {
        setDeviceApprovalRequired(true);

        // Your backend verify-device endpoint
        // requires the staff mobile number.
        setPendingLoginMobile(identifier);

        setError(null);

        return {
          requiresDeviceApproval: true,
        };
      }

      // Original error logic unchanged.
      setError(
        err.response?.data?.message ||
          "Login failed"
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // IMPORTANT:
    // Do not remove deviceId here.
    // Otherwise every logout would make
    // this browser look like a new device.

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        error,

        // NEW
        deviceApprovalRequired,
        pendingLoginMobile,
        setDeviceApprovalRequired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
