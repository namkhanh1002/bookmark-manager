import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getToken, setToken, setUnauthorizedHandler } from "../lib/api";
import { loginRequest, meRequest, registerRequest } from "../services/authService";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name?: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(() => Boolean(getToken()));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const controller = new AbortController();
    meRequest(controller.signal)
      .then((profile) => setUser(profile))
      .catch(() => {
        if (!controller.signal.aborted) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setInitializing(false);
      });

    return () => controller.abort();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const result = await registerRequest(email, password, name);
    setUser(result.user);
    return result.user;
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, register, logout }),
    [user, initializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
