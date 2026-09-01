import axios from "axios";

/**
 * Centralized Axios instance.
 * Connected directly to the real Django + DRF + JWT backend server.
 * No production URL is hard-coded.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/** Runs against the real backend (mocking disabled in Stage 2). */
export const USE_MOCK = false;

export const TOKEN_KEY = "forgeon.auth.token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY) || "",
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Normalizes backend errors into short, user-safe messages. */
export function toUserMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (error.isApiError && error.message) return error.message;
  const data = error.response?.data;
  if (typeof data === "string" && data.length < 160) return data;
  if (data?.detail) return data.detail;
  if (data && typeof data === "object") {
    const first = Object.values(data).flat()[0];
    if (typeof first === "string") return first;
  }
  if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
  return fallback;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) tokenStore.clear();
    return Promise.reject(error);
  }
);
