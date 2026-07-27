import axiosInstance from "./axiosInstance";

export const addService = (formData) =>
  axiosInstance.post("/services", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getServicesByFarmer = (
  farmerId
) =>
  axiosInstance.get(
    `/services/farmer/${farmerId}`
  );

export const getServiceById = (id) =>
  axiosInstance.get(`/services/${id}`);

export const updateService = (
  id,
  formData
) =>
  axiosInstance.put(
    `/services/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

export const deleteService = (id) =>
  axiosInstance.delete(`/services/${id}`);

// Apply discount
export const applyDiscount = (
  id,
  data
) =>
  axiosInstance.post(
    `/services/${id}/discount`,
    data
  );