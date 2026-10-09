import { api, setToken } from "../lib/api";
import type { User } from "../types";

export interface AuthResponse {
  token: string;
  user: User;
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const res = await api<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    silent401: true,
  });
  setToken(res.data.token);
  return res.data;
}

export async function registerRequest(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResponse> {
  const res = await api<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: { email, password, name },
    silent401: true,
  });
  setToken(res.data.token);
  return res.data;
}

export async function meRequest(signal?: AbortSignal): Promise<User> {
  const res = await api<User>("/api/auth/me", { signal, silent401: true });
  return res.data;
}
