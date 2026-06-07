"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Car,
  Shield,
  MapPin,
  FileText,
  Bot,
  Bell,
  ChevronRight,
  Zap,
  Globe,
  Lock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Logo from "@/app/components/Logo";

const features = [
  {
    icon: Car,
    title: "Vehicle Management",
    desc: "Manage all your vehicles in one place. Track registration, fitness, insurance, and PUC status.",
    color: "#6366f1",
  },
  {
    icon: Shield,
    title: "Challan Center",
    desc: "View, pay, and track traffic challans. Integrated with official e-Challan systems.",
    color: "#22c55e",
  },
  {
    icon: MapPin,
    title: "Live Navigation",
    desc: "Google Maps powered navigation with road alerts, speed breakers, and toll plaza info.",
    color: "#f59e0b",
  },
  {
    icon: FileText,
    title: "Document Vault",
    desc: "Secure DigiLocker integration. Store DL, RC, Insurance, PUC, and Aadhaar-linked docs.",
    color: "#3b82f6",
  },
  {
    icon: Bot,
    title: "Astra AI",
    desc: "Your intelligent mobility co-pilot powered by Google Gemini. Voice-enabled, multilingual.",
    color: "#a855f7",
  },
  {
    icon: Lock,
    title: "Anti-Theft",
    desc: "Geofencing, tamper detection, and live tracking to keep your vehicles safe.",
    color: "#ef4444",
  },
];

const stats = [
  { value: "13+", label: "Features" },
  { value: "7", label: "Premium Themes" },
  { value: "3", label: "Languages" },
  { value: "100%", label: "Real APIs" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Orbs */}
      <div className="bg-orb w-[600px] h-[600px] top-[-200px] right-[-200px] fixed" style={{ background: "var(--accent-primary)" }} />
      <div className="bg-orb w-[500px] h-[500px] bottom-[-150px] left-[-150px] fixed" style={{ background: "#a855f7", animationDelay: "5s" }} />
      <div className="bg-orb w-[300px] h-[300px] top-[40%] left-[50%] fixed" style={{ background: "#06b6d4", animationDelay: "10s" }} />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="no-underline">
            <Logo size={36} showText={true} />
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/auth/login" className="btn btn-ghost text-sm">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn btn-primary text-sm">
              Get Started <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="badge badge-success mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Production Ready Platform
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
              One Identity.
              <br />
              <span className="gradient-text">Every Vehicle</span>
              <br />
              Service.
            </h1>

            <p
              className="text-lg md:text-xl leading-relaxed mb-10 max-w-xl"
              style={{ color: "var(--text-secondary)" }}
            >
              India&apos;s most advanced vehicle management ecosystem. Manage
              vehicles, challans, documents, navigation, insurance, and more —
              all in one place.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/auth/register" className="btn btn-primary text-base px-8 py-3">
                <Sparkles size={18} />
                Create Free Account
              </Link>
              <Link href="/auth/login" className="btn btn-secondary text-base px-8 py-3">
                Quick Login
                <ArrowRight size={18} />
              </Link>
            </div>

            {/* Stats Row */}
            <div className="flex gap-8 mt-12 pt-8" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <div className="text-2xl font-extrabold gradient-text">{stat.value}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Interactive Preview Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <div className="card-elevated p-8 relative overflow-hidden">
              {/* Accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                style={{ background: "var(--accent-gradient)" }}
              />

              <div className="flex items-center gap-3 mb-6">
                <Bot size={20} style={{ color: "var(--accent-primary)" }} />
                <span className="font-bold text-lg">Astra AI</span>
                <span
                  className="text-xs px-2 py-1 rounded-full ml-auto"
                  style={{ background: "var(--accent-dim)", color: "var(--accent-primary)" }}
                >
                  Powered by Gemini
                </span>
              </div>

              {/* Chat Preview */}
              <div className="space-y-4 mb-6">
                <div
                  className="p-4 rounded-2xl rounded-tl-sm text-sm"
                  style={{ background: "var(--bg-tertiary)" }}
                >
                  <div className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                    You
                  </div>
                  What are the traffic fines for over-speeding in Maharashtra?
                </div>
                <div
                  className="p-4 rounded-2xl rounded-tr-sm text-sm"
                  style={{ background: "var(--accent-dim)", borderLeft: "3px solid var(--accent-primary)" }}
                >
                  <div className="text-xs mb-2" style={{ color: "var(--accent-secondary)" }}>
                    Astra AI
                  </div>
                  Under <strong>Section 183 MVA</strong>, over-speeding in Maharashtra carries a fine of{" "}
                  <strong>₹2,000</strong> for the first offence and <strong>₹4,000</strong> for repeat
                  violations. Speed limits vary: 40 km/h in city zones, 80 km/h on highways.
                </div>
              </div>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-2">
                {["🚗 Vehicle Info", "📋 Challans", "🗺️ Navigation", "📄 Documents", "🔒 Security"].map(
                  (tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="badge badge-info mx-auto mb-4">
              <Zap size={12} />
              Comprehensive Platform
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Everything you need,
              <br />
              <span className="gradient-text">in one ecosystem.</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              From vehicle registration to AI-powered assistance, DriveVerse brings every vehicle
              service under one intelligent platform.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card p-6 group cursor-pointer"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{
                    background: `${feature.color}15`,
                    border: `1px solid ${feature.color}30`,
                  }}
                >
                  <feature.icon size={22} style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card-elevated p-12 md:p-16 relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: "var(--accent-gradient)" }}
            />
            <Globe size={40} className="mx-auto mb-6" style={{ color: "var(--accent-primary)" }} />
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Ready to experience the future
              <br />
              of <span className="gradient-text">vehicle management</span>?
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Join DriveVerse today and take control of your entire vehicle ecosystem
              with India&apos;s most intelligent mobility platform.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/auth/register" className="btn btn-primary text-base px-8 py-3">
                <Sparkles size={18} />
                Get Started Free
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 py-8 px-6 text-center space-y-4"
        style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}
      >
        <div className="flex justify-center gap-6 text-sm">
          <Link href="/terms" className="no-underline transition-colors hover:text-white" style={{ color: "var(--text-secondary)" }}>
            Terms & Conditions
          </Link>
          <a href="#" className="no-underline transition-colors hover:text-white" style={{ color: "var(--text-secondary)" }}>
            Privacy Policy
          </a>
        </div>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          © 2026 DriveVerse. One Identity. Every Vehicle Service. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
