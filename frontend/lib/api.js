import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080";

export const api = axios.create({ baseURL: API_URL });

// Auth
export const loginUser = (values) =>
  fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
export const registerUser = (values) =>
  fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

// Detection
export const uploadFile = (formData) =>
  api.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// History
export const fetchHistory = (userId) => api.get(`/api/history/${userId}`);
export const deleteRecord = (userId, multimediaId) =>
  api.delete(`/api/history/${userId}/${multimediaId}`);
export const clearAllHistory = (userId) =>
  api.delete(`/api/history/clear/${userId}`);
