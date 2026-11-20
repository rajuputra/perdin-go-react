import { useState, useEffect, type ReactNode } from "react";
import type { User, LoginResponse } from "../types";
import api from "../api/axios";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    const clearUser = () => setUser(null);
    window.addEventListener("auth:unauthorized", clearUser);

    api.get<LoginResponse>("/api/auth/me", { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setUser({ id: data.id, username: data.username, roles: [data.role] });
      })
      .catch(() => {
        if (!controller.signal.aborted) clearUser();
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => {
      controller.abort();
      window.removeEventListener("auth:unauthorized", clearUser);
    };
  }, []);

  const login = (data: LoginResponse) => {
    setUser({ id: data.id, username: data.username, roles: [data.role] });
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
