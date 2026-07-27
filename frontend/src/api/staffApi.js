import axiosInstance from "./axiosInstance";

export const getStaffPerformance = () => axiosInstance.get("/staff/performance");