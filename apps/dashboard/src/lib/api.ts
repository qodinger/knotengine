import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Helper to get headers with API key
export const getAuthHeaders = () => {
  if (typeof window === "undefined") return {};
  const apiKey = localStorage.getItem("tp_api_key");
  return apiKey ? { "x-api-key": apiKey } : {};
};

// Interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("tp_api_key");
      window.location.reload();
    }
    return Promise.reject(error);
  },
);
