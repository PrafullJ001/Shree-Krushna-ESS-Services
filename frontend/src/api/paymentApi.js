﻿import axiosInstance from "./axiosInstance";

export const addPayment = (paymentData) =>
  axiosInstance.post("/payments", paymentData);

export const getPaymentsForService = (serviceRecordId) =>
  axiosInstance.get(`/payments/service/${serviceRecordId}`);

export const getPaymentsForFarmer = (farmerId) =>
  axiosInstance.get(`/payments/farmer/${farmerId}`);

export const getPendingPayments = () =>
  axiosInstance.get("/payments/pending");

export const updatePayment = (id, paymentData) =>
  axiosInstance.put(`/payments/${id}`, paymentData);

export const deletePayment = (id) =>
  axiosInstance.delete(`/payments/${id}`);