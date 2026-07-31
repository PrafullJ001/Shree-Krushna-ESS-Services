import axiosInstance from "./axiosInstance";

export const addPayment = (paymentData) => axiosInstance.post("/payments", paymentData);

export const getPaymentsForService = (serviceRecordId) =>
  axiosInstance.get(`/payments/service/${serviceRecordId}`);

export const getPaymentsForFarmer = (farmerId) =>
  axiosInstance.get(`/payments/farmer/${farmerId}`);

export const getPendingPayments = (from, to) => {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const query = params.toString();
  return axiosInstance.get(`/payments/pending${query ? `?${query}` : ""}`);
};

export const updatePayment = (id, data) => axiosInstance.put(`/payments/${id}`, data);

export const deletePayment = (id) => axiosInstance.delete(`/payments/${id}`);

export const settleAllForFarmer = (farmerId) =>
  axiosInstance.post(`/payments/settle-all/${farmerId}`);

export const recordBulkPayment = (farmerId, data) =>
  axiosInstance.post(`/payments/bulk/${farmerId}`, data);