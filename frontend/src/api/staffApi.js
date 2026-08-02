import axiosInstance from "./axiosInstance";

export const getStaffPerformance = (from, to) =>
  axiosInstance.get("/staff/performance", { params: { from, to } });

// Per-staff totals for a single user, optionally scoped to a date range —
// used by the individual "Filter" control on each staff card.
export const getStaffPerformanceForUser = (userId, from, to) =>
  axiosInstance.get(`/staff/performance/${userId}`, { params: { from, to } });

// Lightweight staff/admin list (name, role, mobile, trustedDevices) — used
// by Manage Staff Login to show who's currently trusted on a device.
export const getAllStaff = () => axiosInstance.get("/staff");

// Clears a staff member's trustedDevices, forcing a fresh OTP device
// approval on their next login.
export const signOutStaff = (userId) =>
  axiosInstance.post(`/staff/${userId}/signout`);