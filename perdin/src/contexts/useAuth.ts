import { createContext, useContext } from "react";
import type { User, LoginResponse } from "../types";

export const AuthContext = createContext<{
  user: User | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
} | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
