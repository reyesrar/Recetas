import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from "../../_shared/_types";
import ENV from "../config/env";

const apiClient = axios.create({
  baseURL: ENV.apiUrl,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const authService = {
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post("/auth/register", credentials);
      return response.data;
    } catch (error: any) {
      return (
        error.response?.data || {
          success: false,
          message: "Network error",
        }
      );
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post("/auth/login", credentials);
      return response.data;
    } catch (error: any) {
      return (
        error.response?.data || {
          success: false,
          message: "Network error",
        }
      );
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
  },
};

export default apiClient;
