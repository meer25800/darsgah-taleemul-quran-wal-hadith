"use client";

import axios from "axios";

function normalizeApiUrl(value?: string) {
  const raw = (value || "http://localhost:5000/api").replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

export const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

export const api = axios.create({ baseURL: API_URL, timeout: 8000 });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("darsgah_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function downloadFile(path: string, filename: string) {
  const { data } = await api.get(path, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
