import axiosInstance from "./axiosInstance";

export const getStaffPerformance = (from, to) =>
  axiosInstance.get("/staff/performance", { params: { from, to } });

// Per-staff totals for a single user, optionally scoped to a date range —
// used by the individual "Filter" control on each staff card.
export const getStaffPerformanceForUser = (userId, from, to) =>
  axiosInstance.get(`/staff/performance/${userId}`, { params: { from, to } });