import axiosInstance from "./axiosInstance";

export const loginRequest = (identifier, password, deviceId) =>
  axiosInstance.post("/auth/login", {
    identifier,
    password,
    deviceId,
  });

export const verifyDeviceRequest = (mobile, otp, deviceId) =>
  axiosInstance.post("/auth/verify-device", {
    mobile,
    otp,
    deviceId,
  });

export const registerRequest = (userData) =>
  axiosInstance.post("/auth/register", userData);

export const getMeRequest = () =>
  axiosInstance.get("/auth/me");

export const updateProfileRequest = (profileData) =>
  axiosInstance.put("/auth/me", profileData);