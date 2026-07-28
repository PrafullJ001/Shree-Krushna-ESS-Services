import axiosInstance from "./axiosInstance";

export const addPayment = (paymentData) => axiosInstance.post("/payments", paymentData);

export const getPaymentsForService = (serviceRecordId) =>
  axiosInstance.get(`/payments/service/${serviceRecordId}`);

export const getPaymentsForFarmer = (farmerId) =>
  axiosInstance.get(`/payments/farmer/${farmerId}`);

export const getPendingPayments = () => axiosInstance.get("/payments/pending");

export const updatePayment = (id, data) => axiosInstance.put(`/payments/${id}`, data);

export const deletePayment = (id) => axiosInstance.delete(`/payments/${id}`);

export const settleAllForFarmer = (farmerId) =>
  axiosInstance.post(`/payments/settle-all/${farmerId}`);

export const recordBulkPayment = (farmerId, data) =>
  axiosInstance.post(`/payments/bulk/${farmerId}`, data);