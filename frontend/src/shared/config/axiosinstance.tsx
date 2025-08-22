import axios from "axios";


const BASE_URL =import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000, // fail fast on stuck requests
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Attach token if present (skip if missing)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // only set header when token exists
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Dev-only request log
    if (import.meta.env.DEV) {
      const url = `${config.baseURL || ""}${config.url || ""}`;
      console.log("[REQ]", config.method?.toUpperCase(), url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors globally and surface useful messages
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // Optional: nicer console output in dev
    if (import.meta.env.DEV) {
      const url = `${error?.config?.baseURL || ""}${error?.config?.url || ""}`;
      console.warn("[RES ERR]", status, url, error?.response?.data || error.message);
    }

    if (status === 401 || status === 403) {
      localStorage.clear();
      const here = window.location.pathname;
      if (here !== "/" && here !== "/login") {
        window.location.replace("/"); 
      }
    }

    // Normalize error so callers can show a message
    const apiMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Request failed. Please try again.";
    error.normalizedMessage = apiMessage;

    return Promise.reject(error);
  }
);

export default axiosInstance;
