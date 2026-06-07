"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import Logo from "@/app/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.login(identifier, password);
      if (res.ok) {
        const data = res.data as {
          status: string;
          tokens?: { access_token: string; refresh_token: string };
        };
        if (data.status === "verification_required") {
          setStep("otp");
        } else {
          const tokens = data.tokens!;
          localStorage.setItem("driveverse_token", tokens.access_token);
          localStorage.setItem("driveverse_refresh", tokens.refresh_token);
          router.push("/dashboard");
        }
      } else {
        setError((res.data as { detail?: string }).detail || "Login failed");
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
      const isEmail = identifier.includes("@");
      const res = await api.verifyOtp(
        otp,
        isEmail ? identifier : undefined,
        isEmail ? undefined : identifier
      );
      if (res.ok) {
        const data = res.data as { tokens: { access_token: string; refresh_token: string } };
        localStorage.setItem("driveverse_token", data.tokens.access_token);
        localStorage.setItem("driveverse_refresh", data.tokens.refresh_token);
        router.push("/dashboard");
      } else {
        setError((res.data as { detail?: string }).detail || "Verification failed");
      }
    } catch {
      setError("Connection error during verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.login("jashthakkar77@gmail.com", "Password123!");
      if (res.ok) {
        const data = res.data as { tokens: { access_token: string; refresh_token: string } };
        localStorage.setItem("driveverse_token", data.tokens.access_token);
        localStorage.setItem("driveverse_refresh", data.tokens.refresh_token);
        router.push("/dashboard");
      } else {
        setError((res.data as { detail?: string }).detail || "Demo login failed");
      }
    } catch {
      setError("Connection error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="bg-orb w-[500px] h-[500px] top-[-100px] right-[-100px] fixed" style={{ background: "var(--accent-primary)" }} />
      <div className="bg-orb w-[400px] h-[400px] bottom-[-100px] left-[-100px] fixed" style={{ background: "#a855f7" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="card-elevated p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex justify-center mb-6 no-underline">
              <Logo size={40} showText={true} />
            </Link>
            <h1 className="text-2xl font-bold mb-2">
              {step === "form" ? "Welcome back" : "Enter Verification Code"}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              {step === "form"
                ? "Sign in to your account to continue"
                : `We sent a login confirmation OTP to ${identifier}`}
            </p>
          </div>

          {/* Quick Demo Access Box (Only on login form) */}
          {step === "form" && (
            <div className="mb-6 p-4 rounded-xl relative overflow-hidden transition-all duration-300 hover:scale-[1.02] border"
              style={{
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)",
                borderColor: "rgba(99, 102, 241, 0.3)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">💡</span>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">Quick Demo Access</h4>
                  <p className="text-xs mb-3" style={{ color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    Log in instantly as <strong>jashthakkar77@gmail.com</strong> with pre-seeded global vehicles (India, UAE, US), active logs, and custom assets.
                  </p>
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="btn btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 w-full justify-center transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                    style={{
                      background: "var(--accent-gradient)",
                      border: "none",
                    }}
                  >
                    {loading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <span>Launch Demo Dashboard</span>
                        <ArrowRight size={12} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--error-dim)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          {/* Form */}
          {step === "form" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Email or Phone</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com or 9876543210"
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input pl-10 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer" style={{ color: "var(--text-tertiary)" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full py-3 text-base" disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Sign In</span><ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="input text-center text-2xl font-bold tracking-[0.5em]"
                  required
                  minLength={6}
                  maxLength={6}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full py-3 text-base" disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Verify & Sign In</span><ArrowRight size={16} /></>}
              </button>

              <button type="button" onClick={() => setStep("form")} className="btn btn-ghost w-full text-sm flex items-center justify-center gap-1.5">
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </form>
          )}

          {/* Divider */}
          {step === "form" && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>OR</span>
                <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
              </div>

              {/* Google OAuth */}
              <button className="btn btn-secondary w-full py-3 flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
            </>
          )}

          {/* Footer */}
          <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-semibold no-underline" style={{ color: "var(--accent-primary)" }}>
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
