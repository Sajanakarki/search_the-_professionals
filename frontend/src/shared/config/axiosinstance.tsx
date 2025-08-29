import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
      const url = `${config.baseURL || ""}${config.url || ""}`;
      console.log("[REQ]", config.method?.toUpperCase(), url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (import.meta.env.DEV) {
      const url = `${error?.config?.baseURL || ""}${error?.config?.url || ""}`;
      console.warn("[RES ERR]", status, url, error?.response?.data || error.message);
    }
    if (status === 401 || status === 403) {
      localStorage.clear();
      const here = window.location.pathname;
      if (here !== "/" && here !== "/login") window.location.replace("/");
    }
    error.normalizedMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Request failed. Please try again.";
    return Promise.reject(error);
  }
);

export default axiosInstance;
