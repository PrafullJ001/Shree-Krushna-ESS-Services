import axiosInstance from "./axiosInstance";

export const searchFarmers = (query) =>
  axiosInstance.get(`/farmers/search?q=${encodeURIComponent(query)}`);

export const checkDuplicateFarmer = (mobile) =>
  axiosInstance.get(`/farmers/check-duplicate?mobile=${encodeURIComponent(mobile)}`);

export const checkSimilarFarmers = (fullName, mobile) =>
  axiosInstance.get(`/farmers/check-similar?fullName=${encodeURIComponent(fullName)}&mobile=${encodeURIComponent(mobile)}`);

export const registerFarmer = (farmerData) =>
  axiosInstance.post("/farmers", farmerData);

export const getFarmerProfile = (id) =>
  axiosInstance.get(`/farmers/${id}`);

export const updateFarmer = (id, farmerData) =>
  axiosInstance.put(`/farmers/${id}`, farmerData);

export const deleteFarmer = (id) =>
  axiosInstance.delete(`/farmers/${id}`);

export const getPublicStatement = (id) =>
  axiosInstance.get(`/public/farmers/${id}/statement`);