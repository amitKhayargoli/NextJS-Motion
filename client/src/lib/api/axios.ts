import axios from "axios";
import { getTokenCookie } from "../cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getTokenCookie();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default axiosInstance;
