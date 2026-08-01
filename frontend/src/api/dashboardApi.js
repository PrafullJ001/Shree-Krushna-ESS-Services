import axiosInstance from "./axiosInstance";

export const getDashboardStats = (params = {}) =>
  axiosInstance.get("/dashboard", { params });