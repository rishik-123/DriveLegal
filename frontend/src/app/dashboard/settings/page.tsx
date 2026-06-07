"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Palette, Bell, Shield, User, Globe, ChevronRight, Check, Smartphone, Lock, Eye, Download, Trash2, Camera, RefreshCw } from "lucide-react";
import api from "@/lib/api";

const themes = [
  { id: "neo-black", label: "Neo Black", desc: "Deep dark with indigo accents", preview: "#06080c" },
  { id: "light", label: "Light", desc: "Clean and bright", preview: "#f8fafc" },
  { id: "dark", label: "Dark", desc: "Classic dark mode", preview: "#111318" },
  { id: "midnight", label: "Midnight Blue", desc: "Deep ocean blue", preview: "#0a0e1a" },
  { id: "aurora", label: "Aurora", desc: "Northern lights inspired", preview: "#07090e" },
  { id: "cyber", label: "Cyber Glass", desc: "Futuristic neon", preview: "#05010f" },
  { id: "titanium", label: "Titanium", desc: "Minimal metallic", preview: "#101214" },
];

const presetAvatars = [
  { name: "Jash", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jash" },
  { name: "Astra", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Astra" },
  { name: "Felix", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
  { name: "Aneka", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" },
  { name: "Cool", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool" },
  { name: "Retro", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Retro" }
];

export default function SettingsPage() {
  const [currentTheme, setCurrentTheme] = useState("neo-black");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifPush, setNotifPush] = useState(false);
  const [language, setLanguage] = useState("en");

  // User Profile States
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    phone: string;
    profile_photo_url: string | null;
  } | null>(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  useEffect(() => {
    // Theme
    const saved = localStorage.getItem("driveverse_theme") || "neo-black";
    setCurrentTheme(saved);

    // Profile details
    api.getMe().then((res) => {
      if (res.ok) {
        setUserData(res.data as any);
      }
    });
  }, []);

  const applyTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem("driveverse_theme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
  };

  const handleSelectAvatar = async (url: string) => {
    setSavingPhoto(true);
    try {
      const res = await api.post("/api/auth/profile-photo", { photo_url: url });
      if (res.ok) {
        setUserData(prev => prev ? { ...prev, profile_photo_url: url } : null);
        setShowAvatarSelector(false);
        // Force quick reload to sync parent headers/sidebar layout pictures
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to update profile picture:", err);
    } finally {
      setSavingPhoto(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Customize your DriveVerse profile and experience
        </p>
      </div>

      {/* Profile Section */}
      {userData && (
        <section className="card p-6 flex flex-col sm:flex-row items-center gap-6 relative">
          <div className="relative group cursor-pointer" onClick={() => setShowAvatarSelector(!showAvatarSelector)}>
            {userData.profile_photo_url ? (
              <img
                src={userData.profile_photo_url}
                alt="Profile photo"
                className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent-primary)] group-hover:opacity-75 transition-opacity"
              />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white group-hover:opacity-75 transition-opacity" style={{ background: "var(--accent-gradient)" }}>
                {userData.name.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
              <Camera size={18} className="text-white" />
            </div>
          </div>

          <div className="text-center sm:text-left flex-1 space-y-1">
            <h3 className="text-lg font-bold text-white">{userData.name}</h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Email: {userData.email}</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Mobile: {userData.phone}</p>
          </div>

          <button
            onClick={() => setShowAvatarSelector(!showAvatarSelector)}
            className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            Change Avatar
          </button>
        </section>
      )}

      {/* Avatar Selection Modal/Panel */}
      <AnimatePresence>
        {showAvatarSelector && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Select Avatar Cloud Asset
              </h4>
              <button
                onClick={() => setShowAvatarSelector(false)}
                className="btn btn-ghost px-2 py-1 text-xs"
              >
                Close
              </button>
            </div>

            {savingPhoto ? (
              <div className="py-6 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
                <RefreshCw size={18} className="animate-spin mx-auto mb-2" /> Saving changes to cloud...
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {presetAvatars.map((av, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectAvatar(av.url)}
                    className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)] hover:scale-105 transition-all cursor-pointer flex flex-col items-center gap-2"
                  >
                    <img src={av.url} alt={av.name} className="w-12 h-12 rounded-full object-cover" />
                    <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                      {av.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Selection */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
          <Palette size={14} /> Appearance
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {themes.map((theme) => (
            <motion.button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="card p-4 text-left relative cursor-pointer bg-transparent"
              style={{
                border: currentTheme === theme.id ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
              }}
            >
              {currentTheme === theme.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--accent-primary)" }}>
                  <Check size={12} className="text-white" />
                </div>
              )}
              <div className="w-full h-8 rounded-md mb-3" style={{ background: theme.preview, border: "1px solid var(--border-default)" }} />
              <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{theme.label}</div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{theme.desc}</div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Language */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
          <Globe size={14} /> Language
        </h2>
        <div className="flex gap-2">
          {[
            { code: "en", label: "English", flag: "🇬🇧" },
            { code: "hi", label: "हिंदी", flag: "🇮🇳" },
            { code: "mr", label: "मराठी", flag: "🇮🇳" },
          ].map((lang) => (
            <button key={lang.code} onClick={() => setLanguage(lang.code)} className="card px-4 py-3 flex items-center gap-2 cursor-pointer bg-transparent"
              style={{ border: language === lang.code ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.label}</span>
              {language === lang.code && <Check size={14} style={{ color: "var(--accent-primary)" }} />}
            </button>
          ))}
        </div>
      </section>

      {/* Notification Preferences */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
          <Bell size={14} /> Notifications
        </h2>
        <div className="space-y-2">
          <ToggleRow label="Email Notifications" desc="Challan alerts, document expiry, insurance reminders" checked={notifEmail} onChange={setNotifEmail} />
          <ToggleRow label="SMS Notifications" desc="Critical alerts via text message (Deactivated - using email OTP)" checked={notifSms} onChange={setNotifSms} />
          <ToggleRow label="Push Notifications" desc="Browser push notifications (requires permission)" checked={notifPush} onChange={setNotifPush} />
        </div>
      </section>

      {/* Security */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
          <Shield size={14} /> Security & Privacy
        </h2>
        <div className="space-y-2">
          <SettingsLink icon={Lock} label="Change Password" desc="Update your account password" />
          <SettingsLink icon={Smartphone} label="Active Sessions" desc="View and manage logged-in devices" />
          <SettingsLink icon={Eye} label="Privacy Controls" desc="Manage data visibility and sharing" />
          <SettingsLink icon={Download} label="Export Data" desc="Download your complete DriveVerse data" />
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--error)" }}>
          <Trash2 size={14} /> Danger Zone
        </h2>
        <div className="card p-4 flex items-center justify-between" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
          <div>
            <div className="font-bold text-sm">Delete Account</div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Permanently delete your DriveVerse account and all data</div>
          </div>
          <button className="btn text-sm px-4 py-2" style={{ background: "var(--error-dim)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.2)" }}>Delete</button>
        </div>
      </section>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <div className="card p-4 flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!checked)} className="w-11 h-6 rounded-full relative transition-colors cursor-pointer border-none" style={{ background: checked ? "var(--accent-primary)" : "var(--bg-elevated)" }}>
        <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all" style={{ left: checked ? "24px" : "4px" }} />
      </button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SettingsLink({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <button className="card p-4 flex items-center gap-4 w-full text-left cursor-pointer bg-transparent" style={{ border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
      <Icon size={18} style={{ color: "var(--text-tertiary)" }} />
      <div className="flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{desc}</div>
      </div>
      <ChevronRight size={16} style={{ color: "var(--text-tertiary)" }} />
    </button>
  );
}
