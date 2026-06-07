"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import Logo from "@/app/components/Logo";

export default function TermsPage() {
  return (
    <div className="min-h-screen relative overflow-hidden py-12 px-6">
      {/* Background Orbs */}
      <div className="bg-orb w-[600px] h-[600px] top-[-200px] right-[-200px] fixed" style={{ background: "var(--accent-primary)" }} />
      <div className="bg-orb w-[500px] h-[500px] bottom-[-150px] left-[-150px] fixed" style={{ background: "#a855f7", animationDelay: "5s" }} />

      <div className="max-w-3xl mx-auto relative z-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="btn btn-ghost px-4 py-2 text-sm flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <Logo size={32} showText={true} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-8 md:p-12 space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--accent-dim)] text-[var(--accent-primary)]">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Last Updated: June 2, 2026</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Welcome to DriveVerse. Please read these Terms of Service ("Terms") carefully before using the DriveVerse web application and services ("Service") operated by our team. By accessing or using the Service, you agree to be bound by these Terms.
          </p>

          <hr style={{ borderColor: "var(--border-subtle)" }} />

          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: "var(--accent-primary)" }} />
              1. Local Compliance & GPS Real-Time Tracking
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              DriveVerse provides geo-fenced real-time speed monitoring, traffic laws lookup, and compliance tools. To calculate speed accurately and provide zone alerts, the Service tracks your geographic coordinates in real-time via your browser or device GPS. You explicitly consent to this geolocation tracking when you activate GPS navigation or speed alerts.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: "var(--accent-primary)" }} />
              2. DigiLocker Document Vault Integration
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              By linking your DigiLocker account to DriveVerse, you authorize the Service to retrieve and display copies of your government-issued identity documents (Aadhaar, Driving License, PAN, RC). The retrieved documents are processed locally on your device or in secured caches and are never shared with unauthorized third parties.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: "var(--accent-primary)" }} />
              3. Challan Payments & Accuracy Disclaimer
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              The Challan Calculator and local fine schedules are provided for educational and pre-compliance tracking purposes. Fines calculated do not constitute direct legal advice. Compounding fees are subject to local judicial amendments. Official payments must be settled directly through the official e-Challan portal.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: "var(--accent-primary)" }} />
              4. User Accounts and Verification
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              When you create an account, you must provide accurate registration details. Users are verified using email OTP authentication. You are responsible for safeguarding your credentials. We reserve the right to suspend accounts violating traffic compliance policies or exploiting the platform.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: "var(--accent-primary)" }} />
              5. Profile Photo Customization
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              DriveVerse allows uploading custom profile images or choosing avatars. Uploaded photos are stored on cloud hosting secure endpoints and tied to your account. You grant us a non-exclusive license to host and display your profile picture solely for personalizing your dashboard interface.
            </p>
          </div>

          <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "var(--info-dim)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--info)" }}>Privacy Guarantee</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                We prioritize user privacy and document security. Your DigiLocker credentials and real-time location metrics are protected using industry-standard AES encryption and JWT verification protocols.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
