import axiosInstance from "./axiosInstance";

export const addExpense = (data) => axiosInstance.post("/expenses", data);

export const getExpenses = (params = {}) =>
  axiosInstance.get("/expenses", { params });

export const getExpenseStaffList = () =>
  axiosInstance.get("/expenses/staff-list");