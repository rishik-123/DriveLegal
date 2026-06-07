"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, CheckCircle, ExternalLink, X, Shield, Lock, CheckCircle2, User, Key, RefreshCw } from "lucide-react";
import api from "@/lib/api";

interface IDService {
  id: string;
  name: string;
  icon: string;
  desc: string;
  status: "not_connected" | "connected";
  url: string;
  color: string;
  docName: string;
}

const idServicesData: IDService[] = [
  { id: "digilocker", name: "DigiLocker", icon: "📦", desc: "Government document wallet", status: "not_connected", url: "https://services.digitallocker.gov.in/", color: "#3b82f6", docName: "Account" },
  { id: "aadhaar", name: "Aadhaar Card", icon: "🆔", desc: "Unique Identification Authority of India", status: "not_connected", url: "https://uidai.gov.in/", color: "#f59e0b", docName: "Aadhaar UID" },
  { id: "dl", name: "Driving License", icon: "🪪", desc: "Ministry of Road Transport & Highways", status: "not_connected", url: "https://parivahan.gov.in/", color: "#6366f1", docName: "Driving License" },
  { id: "pan", name: "PAN Card", icon: "💳", desc: "Income Tax Department", status: "not_connected", url: "https://www.incometax.gov.in/", color: "#22c55e", docName: "Permanent Account Number" },
  { id: "rc", name: "Vehicle RC", icon: "📋", desc: "Ministry of Road Transport & Highways", status: "not_connected", url: "https://vahan.parivahan.gov.in/", color: "#ec4899", docName: "Registration Certificate" },
];

export default function MyIDsPage() {
  const [idServices, setIdServices] = useState<IDService[]>(idServicesData);
  const [selectedService, setSelectedService] = useState<IDService | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [digiStep, setDigiStep] = useState<"auth" | "otp" | "success">("auth");
  
  // Simulated form inputs
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    const saved = localStorage.getItem("connected_ids");
    if (saved) {
      const ids = JSON.parse(saved) as string[];
      setIdServices(prev =>
        prev.map(s => (ids.includes(s.id) ? { ...s, status: "connected" } : s))
      );
    }
  }, []);

  const handleOpenLocker = (service: IDService) => {
    setSelectedService(service);
    setDigiStep("auth");
    setAadhaarInput("");
    setOtpInput("");
    setShowModal(true);
  };

  const handleDigiLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadhaarInput.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDigiStep("otp");
    }, 1500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDigiStep("success");
      
      // Update status
      setIdServices(prev =>
        prev.map(s => {
          if (s.id === selectedService?.id || (selectedService?.id === "digilocker" && s.id !== "digilocker")) {
            return { ...s, status: "connected" };
          }
          return s;
        })
      );
      
      // Save status
      const currentConnected = idServices
        .map(s => s.id)
        .filter(id => id === selectedService?.id || (selectedService?.id === "digilocker" && id !== "digilocker"));
      
      const saved = localStorage.getItem("connected_ids");
      const existing = saved ? JSON.parse(saved) : [];
      const merged = Array.from(new Set([...existing, ...currentConnected]));
      localStorage.setItem("connected_ids", JSON.stringify(merged));
      
    }, 1500);
  };

  const handleDisconnect = (id: string) => {
    setIdServices(prev =>
      prev.map(s => (s.id === id ? { ...s, status: "not_connected" } : s))
    );
    const saved = localStorage.getItem("connected_ids");
    if (saved) {
      const existing = JSON.parse(saved) as string[];
      const updated = existing.filter(x => x !== id);
      localStorage.setItem("connected_ids", JSON.stringify(updated));
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">My IDs</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Unified identity dashboard — all your connected services in one place
        </p>
      </div>

      {/* ID Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {idServices.map((service, i) => {
          const isConnected = service.status === "connected";
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card p-5 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: service.color }} />
              <div className="flex items-start gap-4 mb-4">
                <span className="text-3xl">{service.icon}</span>
                <div className="flex-1">
                  <div className="font-bold text-lg">{service.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{service.desc}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {isConnected ? (
                  <span className="badge badge-success flex items-center gap-1">
                    <CheckCircle size={10} /> Connected
                  </span>
                ) : (
                  <span className="badge badge-warning">
                    Not Connected
                  </span>
                )}
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(service.id)}
                    className="btn btn-ghost text-xs px-3 py-1.5 border border-red-500/20 hover:bg-red-500/10 text-red-400 hover:text-red-300"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenLocker(service)}
                    className="btn btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    Link Portal <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Single Identity Info */}
      <div className="card-elevated p-6 text-center">
        <Fingerprint size={40} className="mx-auto mb-4" style={{ color: "var(--accent-primary)" }} />
        <h3 className="text-lg font-bold mb-2">Single Identity Dashboard</h3>
        <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          DriveVerse connects your digital identities into a unified dashboard. Link your government services to access verified documents, vehicle records, and more — all in one place.
        </p>
      </div>

      {/* DigiLocker Iframe Modal */}
      <AnimatePresence>
        {showModal && selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl border overflow-hidden shadow-2xl flex flex-col"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}
            >
              {/* Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <div>
                    <h3 className="font-bold text-sm text-white">DigiLocker National Portal</h3>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Linking {selectedService.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors border-none cursor-pointer"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Portal Content Box */}
              <div className="p-6 min-h-[300px] flex flex-col justify-center bg-slate-900 border-t border-slate-800">
                {digiStep === "auth" && (
                  <form onSubmit={handleDigiLogin} className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-2 border border-blue-500/20">
                        <Shield size={22} />
                      </div>
                      <h4 className="font-bold text-sm text-slate-100">Sign in with Aadhaar / Document ID</h4>
                      <p className="text-xs text-slate-400 mt-1">Verify credentials to fetch official {selectedService.docName}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wide">Document / Aadhaar Number</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={aadhaarInput}
                          onChange={(e) => setAadhaarInput(e.target.value)}
                          placeholder={selectedService.id === "aadhaar" ? "12-digit Aadhaar Number" : `Enter ${selectedService.name} ID`}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg p-2.5 pl-9 text-slate-100 text-xs font-mono outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none"
                    >
                      {loading ? <RefreshCw size={14} className="animate-spin" /> : "Request Verification OTP"}
                    </button>
                  </form>
                )}

                {digiStep === "otp" && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
                        <Lock size={22} />
                      </div>
                      <h4 className="font-bold text-sm text-slate-100">Enter Security OTP</h4>
                      <p className="text-xs text-slate-400 mt-1">A 6-digit OTP code has been sent to your Aadhaar-linked mobile</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wide">Security OTP</label>
                      <div className="relative">
                        <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 pl-9 text-slate-100 text-xs tracking-widest text-center font-bold outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold p-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none"
                    >
                      {loading ? <RefreshCw size={14} className="animate-spin" /> : "Verify and Authorize Locker"}
                    </button>
                  </form>
                )}

                {digiStep === "success" && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                      <CheckCircle2 size={36} className="animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-slate-100">Document Linked Successfully</h4>
                      <p className="text-xs text-slate-400">
                        {selectedService.name} is now verified and connected to your DriveVerse wallet.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 rounded-lg text-xs transition-colors cursor-pointer border-none"
                    >
                      Close Window
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
