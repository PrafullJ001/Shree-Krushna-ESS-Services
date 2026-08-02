import axiosInstance from "./axiosInstance";

export const addExpense = (data) => axiosInstance.post("/expenses", data);

export const getExpenses = (params = {}) =>
  axiosInstance.get("/expenses", { params });

export const getExpenseStaffList = () =>
  axiosInstance.get("/expenses/staff-list");

export const updateExpense = (id, data) => axiosInstance.put(`/expenses/${id}`, data);

export const deleteExpense = (id) => axiosInstance.delete(`/expenses/${id}`);