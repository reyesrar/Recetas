import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import ENV from "../config/env";

const apiClient = axios.create({
  baseURL: ENV.apiUrl,
  timeout: 10000,
});

// Add token to requests
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

export default apiClient;
