"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");

  const passwordChecks = [
    { label: "At least 8 characters", valid: form.password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(form.password) },
    { label: "One digit", valid: /\d/.test(form.password) },
    { label: "One special character", valid: /[!@#$%^&*(),.?":{}|<>]/.test(form.password) },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.register(form.name, form.email, form.phone, form.password);
      if (res.ok) {
        const data = res.data as { tokens: { access_token: string; refresh_token: string } };
        localStorage.setItem("driveverse_token", data.tokens.access_token);
        localStorage.setItem("driveverse_refresh", data.tokens.refresh_token);
        // Send OTP for verification
        await api.sendOtp(form.email);
        setStep("otp");
      } else {
        setError((res.data as { detail?: string }).detail || "Registration failed");
      }
    } catch {
      setError("Connection error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.verifyOtp(otp, form.email);
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError((res.data as { detail?: string }).detail || "Verification failed");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <div className="bg-orb w-[500px] h-[500px] top-[-100px] left-[-100px] fixed" style={{ background: "var(--accent-primary)" }} />
      <div className="bg-orb w-[400px] h-[400px] bottom-[-100px] right-[-100px] fixed" style={{ background: "#22c55e" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="card-elevated p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 no-underline">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: "var(--accent-gradient)" }}>D</div>
              <span className="text-xl font-extrabold">Drive<span className="gradient-text">Verse</span></span>
            </Link>
            <h1 className="text-2xl font-bold mb-2">{step === "form" ? "Create your account" : "Verify your email"}</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              {step === "form" ? "Join DriveVerse to manage your vehicle ecosystem" : `We sent a 6-digit code to ${form.email}`}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--error-dim)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          {step === "form" ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rahul Sharma" className="input pl-10" required minLength={2} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="input pl-10" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Mobile Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" className="input pl-10" required minLength={10} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Create a strong password" className="input pl-10 pr-10" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer" style={{ color: "var(--text-tertiary)" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 space-y-1">
                    {passwordChecks.map((check, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: check.valid ? "var(--success)" : "var(--text-tertiary)" }}>
                        <CheckCircle2 size={12} />
                        {check.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary w-full py-3 text-base" disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Create Account</span><ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Verification Code</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit code" className="input text-center text-2xl font-bold tracking-[0.5em]" required minLength={6} maxLength={6} />
              </div>
              <button type="submit" className="btn btn-primary w-full py-3 text-base" disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Verify & Continue</span><ArrowRight size={16} /></>}
              </button>
              <button type="button" onClick={() => setStep("form")} className="btn btn-ghost w-full text-sm">
                ← Back to registration
              </button>
            </form>
          )}

          <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold no-underline" style={{ color: "var(--accent-primary)" }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
