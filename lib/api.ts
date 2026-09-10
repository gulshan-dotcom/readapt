import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const api = axios.create({
  baseURL: "https://redapt-admin-sand.vercel.app/api/user",
});

// State variables to hold injected values from React
let isConnected = true;
let showToast: ((message: string) => void) | null = null;

// Call this function inside your root component or provider
export const configureApiInterceptor = (
  networkStatus: boolean,
  toastFn: (message: string) => void
) => {
  isConnected = networkStatus;
  showToast = toastFn;
};

// Request Interceptor: Block POST/PUT/DELETE when offline
api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();
  
  if (!isConnected && method !== "get") {
    if (showToast) {
      showToast("You are offline. Action cannot be completed.");
    }
    // Cancel the request before sending
    return Promise.reject(new axios.Cancel("Offline request blocked."));
  }

  return config;
});

// Response Interceptor
api.interceptors.response.use(
  async (response) => {
    if (response.config.method?.toLowerCase() === "get") {
      const key = `api_cache:${response.config.url}`;
      await AsyncStorage.setItem(key, JSON.stringify(response.data));
    }
    return response;
  },
  async (error) => {
    const config = error.config;

    if (config?.method?.toLowerCase() === "get") {
      const key = `api_cache:${config.url}`;
      const cached = await AsyncStorage.getItem(key);

      if (cached) {
        return {
          ...error.response,
          data: JSON.parse(cached),
          status: 200,
          statusText: "OK (Cached)",
          config,
        };
      } else {
        if (!isConnected) {
          if (showToast) {
            showToast("You are not connected to internet")
          }
        }
        return error
      }
    }

    return Promise.reject(error);
  }
);