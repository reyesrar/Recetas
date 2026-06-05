import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from "../../_shared/_types";
import ENV from "../config/env";

const api = axios.create({
  baseURL: ENV.apiUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Log API URL in development
if (__DEV__) {
  console.log("API URL:", ENV.apiUrl);
}

export const authService = {
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post("/auth/register", credentials);
      return response.data;
    } catch (error: any) {
      console.error("Register error:", error);
      return (
        error.response?.data || {
          success: false,
          message: "Error de red. Verifica tu conexión",
        }
      );
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    } catch (error: any) {
      console.error("Login error:", error);
      return (
        error.response?.data || {
          success: false,
          message: "Error de red. Verifica tu conexión",
        }
      );
    }
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
  },
};

export default api;
