"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";

type User = { id: string; name: string; username: string; role: "admin" | "super_admin" | "student" | "parent" | "faculty" };

const AuthContext = createContext<{
  user: User | null;
  login: (username: string, password: string, role: string) => Promise<User>;
  logout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("darsgah_user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {
      window.localStorage.removeItem("darsgah_user");
      setUser(null);
    }
  }, []);

  async function login(username: string, password: string, role: string) {
    const { data } = await api.post("/auth/login", { username, password, role });
    if (!data.token) throw new Error("The server did not return a session token.");
    localStorage.setItem("darsgah_token", data.token);
    localStorage.setItem("darsgah_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await api.post("/auth/logout").catch(() => undefined);
    localStorage.removeItem("darsgah_token");
    localStorage.removeItem("darsgah_user");
    setUser(null);
    window.location.assign("/");
  }

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
