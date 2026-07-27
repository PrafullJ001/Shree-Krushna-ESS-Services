import axiosInstance from "./axiosInstance";

export const getDashboardStats = () => axiosInstance.get("/dashboard");