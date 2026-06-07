"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Car, AlertTriangle, MapPin, Bot, FileText,
  Fingerprint, Shield, Thermometer, Bell, Settings, LogOut,
  Menu, X, Sun, Moon, ChevronDown, Search, Calculator
} from "lucide-react";
import api from "@/lib/api";
import Logo from "@/app/components/Logo";

const sidebarItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Vehicles", href: "/dashboard/vehicles", icon: Car },
  { label: "Challan Center", href: "/dashboard/challans", icon: AlertTriangle },
  { label: "Challan Calculator", href: "/dashboard/challan-calculator", icon: Calculator },
  { label: "Traffic Laws", href: "/dashboard/laws", icon: Shield },
  { label: "Navigation", href: "/dashboard/navigation", icon: MapPin },
  { label: "Astra AI", href: "/dashboard/assistant", icon: Bot, accent: true },
  { label: "Documents", href: "/dashboard/documents", icon: FileText },
  { label: "My IDs", href: "/dashboard/ids", icon: Fingerprint },
  { label: "Insurance", href: "/dashboard/insurance", icon: Shield },
  { label: "PUC Center", href: "/dashboard/puc", icon: Thermometer },
  { label: "Anti-Theft", href: "/dashboard/anti-theft", icon: Shield },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const themes = [
  { id: "neo-black", label: "Neo Black" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "midnight", label: "Midnight Blue" },
  { id: "aurora", label: "Aurora" },
  { id: "cyber", label: "Cyber Glass" },
  { id: "titanium", label: "Titanium" },
];

interface UserData {
  name: string;
  email: string;
  driving_score: number;
  profile_photo_url?: string | null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [currentTheme, setCurrentTheme] = useState("neo-black");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("driveverse_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    api.getMe().then((res) => {
      if (res.ok) setUser(res.data as UserData);
      else router.push("/auth/login");
    }).catch(() => router.push("/auth/login"));

    const savedTheme = localStorage.getItem("driveverse_theme") || "neo-black";
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, [router]);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem("driveverse_theme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    setThemeMenuOpen(false);
  };

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem("driveverse_token");
    localStorage.removeItem("driveverse_refresh");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 overflow-hidden"
        style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-subtle)" }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 gap-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <Logo size={28} showText={sidebarOpen} />
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-all"
                style={{
                  background: isActive ? "var(--accent-dim)" : "transparent",
                  color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                  border: isActive ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                }}
              >
                <item.icon size={18} className="flex-shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full bg-transparent border-none cursor-pointer transition-all"
            style={{ color: "var(--text-secondary)" }}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileSidebar(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] z-50 lg:hidden flex flex-col"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div className="h-16 flex items-center justify-between px-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <Logo size={28} showText={true} />
                <button onClick={() => setMobileSidebar(false)} className="bg-transparent border-none cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
                {sidebarItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileSidebar(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline"
                      style={{ background: isActive ? "var(--accent-dim)" : "transparent", color: isActive ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                      <item.icon size={18} />{item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "lg:pl-[260px]" : "lg:pl-[72px]"} pl-0`}>
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30 glass">
          <div className="flex items-center gap-4">
            <button onClick={() => { setSidebarOpen(!sidebarOpen); setMobileSidebar(!mobileSidebar); }} className="bg-transparent border-none cursor-pointer" style={{ color: "var(--text-secondary)" }}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}>
              <Search size={14} style={{ color: "var(--text-tertiary)" }} />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-48" style={{ color: "var(--text-primary)" }} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <div className="relative">
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="btn btn-ghost text-xs px-3 py-1.5"
              >
                {currentTheme === "light" ? <Sun size={14} /> : <Moon size={14} />}
                <span className="hidden sm:inline">{themes.find(t => t.id === currentTheme)?.label}</span>
                <ChevronDown size={12} />
              </button>
              {themeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg p-2 z-50" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-lg)" }}>
                  {themes.map((theme) => (
                    <button key={theme.id} onClick={() => handleThemeChange(theme.id)}
                      className="w-full text-left px-3 py-2 rounded-md text-sm bg-transparent border-none cursor-pointer transition-colors"
                      style={{ color: currentTheme === theme.id ? "var(--accent-primary)" : "var(--text-secondary)", background: currentTheme === theme.id ? "var(--accent-dim)" : "transparent" }}>
                      {theme.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <Link href="/dashboard/notifications" className="btn btn-ghost px-2 py-2 relative">
              <Bell size={18} />
            </Link>

            {/* User Avatar */}
            <div className="flex items-center gap-3 pl-3" style={{ borderLeft: "1px solid var(--border-subtle)" }}>
              {user?.profile_photo_url ? (
                <img src={user.profile_photo_url} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-[var(--border-default)]" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "var(--accent-gradient)" }}>
                  {user?.name?.charAt(0) || "U"}
                </div>
              )}
              <div className="hidden sm:block">
                <div className="text-sm font-semibold">{user?.name || "User"}</div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Score: {user?.driving_score || 100}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
