import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/api";
import { LoginCredentials, RegisterCredentials, User } from "./_types";

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (
    credentials: LoginCredentials,
  ) => Promise<{ success: boolean; message: string }>;
  signUp: (
    credentials: RegisterCredentials,
  ) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const storedToken = await AsyncStorage.getItem("token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);

      if (response.success && response.data) {
        await AsyncStorage.setItem("token", response.data.token);
        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true, message: response.message };
      }

      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: "Error al iniciar sesión" };
    }
  };

  const signUp = async (credentials: RegisterCredentials) => {
    try {
      const response = await authService.register(credentials);

      if (response.success && response.data) {
        await AsyncStorage.setItem("token", response.data.token);
        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true, message: response.message };
      }

      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: "Error al registrarse" };
    }
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
