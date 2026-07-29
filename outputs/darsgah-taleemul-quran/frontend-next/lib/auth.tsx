"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { api } from "./api";

type User = { id: string; name: string; username: string; role: "admin" | "super_admin" | "student" | "parent" | "faculty" };

const AuthContext = createContext<{
  user: User | null;
  login: (username: string, password: string, role: string) => Promise<User>;
  logout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    return JSON.parse(localStorage.getItem("darsgah_user") || "null");
  });

  async function login(username: string, password: string, role: string) {
    const { data } = await api.post("/auth/login", { username, password, role });
    localStorage.setItem("darsgah_token", data.token);
    localStorage.setItem("darsgah_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("darsgah_token");
    localStorage.removeItem("darsgah_user");
    setUser(null);
    window.location.href = "/";
  }

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
