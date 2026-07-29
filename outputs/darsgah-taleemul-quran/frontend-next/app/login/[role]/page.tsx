"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const defaultUsernames: Record<string, string> = {
  admin: "aamirmir08@gmail.com",
  student: "dtq-2026-001",
  parent: "parent",
  faculty: "faculty"
};

export default function LoginPage() {
  const params = useParams<{ role: string }>();
  const role = params.role || "student";
  const [username, setUsername] = useState(defaultUsernames[role] || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetStep, setResetStep] = useState<"closed" | "email" | "otp" | "password">("closed");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const user = await login(username, password, role);
      const dashboardRole = user.role === "super_admin" ? "admin" : user.role;
      router.push(`/dashboard/${dashboardRole}`);
    } catch {
      setError("Invalid credentials or server unavailable.");
    }
  }

  async function requestOtp() {
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/auth/forgot-password/request", { email: username });
      setMessage(data.message);
      setResetStep("otp");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not send OTP.");
    }
  }

  async function verifyOtp() {
    setError("");
    try {
      const { data } = await api.post("/auth/forgot-password/verify", { email: username, otp });
      setMessage(data.message);
      setResetStep("password");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid or expired OTP.");
    }
  }

  async function resetPassword() {
    setError("");
    try {
      const { data } = await api.post("/auth/forgot-password/reset", { email: username, password: newPassword, confirmPassword });
      setMessage(data.message);
      setPassword("");
      setResetStep("closed");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not reset password.");
    }
  }

  return (
    <main className="islamic-pattern grid min-h-[calc(100vh-78px)] place-items-center px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <Image src="/institute-logo.png" alt="Institute logo" width={112} height={112} className="mx-auto rounded-full border-4 border-gold" />
        <p className="mt-4 text-sm font-bold text-palm">DARSGAH TALEEMUL QURAN WAL HADITH</p>
        <h1 className="mt-2 text-3xl font-black capitalize">{role} Login</h1>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
        <form onSubmit={submit} className="mt-5 grid gap-4 text-left">
          <label className="text-sm font-semibold">Username / ID</label>
          <div className="flex items-center gap-2 rounded-xl border px-3"><UserRound size={18} /><Input className="border-0" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></div>
          <label className="text-sm font-semibold">Password</label>
          <div className="flex items-center gap-2 rounded-xl border px-3"><Lock size={18} /><Input className="border-0" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Type password" autoComplete="current-password" /></div>
          <Button>Login</Button>
        </form>
        {role === "admin" && (
          <div className="mt-4 border-t pt-4 text-left">
            {resetStep === "closed" && <button className="text-sm font-semibold text-palm underline" onClick={() => setResetStep("email")}>Forgot Password?</button>}
            {resetStep === "email" && (
              <div className="grid gap-3">
                <p className="text-sm text-emerald-800">OTP will be sent only to aamirmir08@gmail.com.</p>
                <Button type="button" onClick={requestOtp}>Send OTP</Button>
              </div>
            )}
            {resetStep === "otp" && (
              <div className="grid gap-3">
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6 digit OTP" />
                <Button type="button" onClick={verifyOtp}>Verify OTP</Button>
              </div>
            )}
            {resetStep === "password" && (
              <div className="grid gap-3">
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
                <Button type="button" onClick={resetPassword}>Reset Password</Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </main>
  );
}
