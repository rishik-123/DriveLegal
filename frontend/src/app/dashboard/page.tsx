"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Car, AlertTriangle, FileText, Shield, Zap, TrendingUp, MapPin, Bot } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

const quickActions = [
  { icon: Car, label: "Add Vehicle", href: "/dashboard/vehicles", color: "#6366f1" },
  { icon: AlertTriangle, label: "Check Challans", href: "/dashboard/challans", color: "#f59e0b" },
  { icon: FileText, label: "View Documents", href: "/dashboard/documents", color: "#3b82f6" },
  { icon: MapPin, label: "Start Navigation", href: "/dashboard/navigation", color: "#22c55e" },
  { icon: Bot, label: "Ask Astra AI", href: "/dashboard/assistant", color: "#a855f7" },
  { icon: Shield, label: "Anti-Theft", href: "/dashboard/anti-theft", color: "#ef4444" },
];

export default function DashboardHome() {
  const [stats, setStats] = useState({
    drivingScore: 100,
    vehiclesCount: 0,
    documentsCount: 0,
    pendingChallansCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [meRes, vehiclesRes, docsRes, challansRes] = await Promise.all([
          api.getMe(),
          api.getVehicles(),
          api.getDocuments(),
          api.getChallans(),
        ]);

        const drivingScore = meRes.ok ? (meRes.data as any).driving_score : 100;
        const vehiclesCount = vehiclesRes.ok ? (vehiclesRes.data as any).count || 0 : 0;
        const documentsCount = docsRes.ok ? (docsRes.data as any).count || 0 : 0;
        
        let pendingChallansCount = 0;
        if (challansRes.ok) {
          const challansList = (challansRes.data as any).challans || [];
          pendingChallansCount = challansList.filter((c: any) => c.status === "pending").length;
        }

        setStats({
          drivingScore,
          vehiclesCount,
          documentsCount,
          pendingChallansCount,
        });
      } catch (err) {
        console.error("Error fetching statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { 
      label: "Driving Score", 
      value: loading ? "..." : stats.drivingScore.toString(), 
      icon: Zap, 
      trend: stats.drivingScore >= 90 ? "Excellent standing" : "Needs attention", 
      trendUp: stats.drivingScore >= 90, 
      color: "#22c55e" 
    },
    { 
      label: "Vehicles", 
      value: loading ? "..." : stats.vehiclesCount.toString(), 
      icon: Car, 
      trend: stats.vehiclesCount === 0 ? "Add your first vehicle" : `${stats.vehiclesCount} active in garage`, 
      trendUp: stats.vehiclesCount > 0, 
      color: "#6366f1" 
    },
    { 
      label: "Active Documents", 
      value: loading ? "..." : stats.documentsCount.toString(), 
      icon: FileText, 
      trend: stats.documentsCount === 0 ? "Connect DigiLocker" : `${stats.documentsCount} verified documents`, 
      trendUp: stats.documentsCount > 0, 
      color: "#3b82f6" 
    },
    { 
      label: "Pending Challans", 
      value: loading ? "..." : stats.pendingChallansCount.toString(), 
      icon: AlertTriangle, 
      trend: stats.pendingChallansCount === 0 ? "All clear!" : `${stats.pendingChallansCount} action required`, 
      trendUp: stats.pendingChallansCount === 0, 
      color: stats.pendingChallansCount === 0 ? "#22c55e" : "#ef4444" 
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Welcome Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome to DriveVerse</h1>
            <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
              Your intelligent mobility dashboard. Manage everything in one place.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "var(--success-dim)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium" style={{ color: "var(--success)" }}>All Systems Active</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{stat.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-3xl font-extrabold mb-1" style={{ letterSpacing: "-1px" }}>{stat.value}</div>
            <div className="flex items-center gap-1 text-xs" style={{ color: stat.trendUp ? "var(--success)" : "var(--error)" }}>
              <TrendingUp size={12} />
              {stat.trend}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-tertiary)" }}>Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <Link href={action.href} className="card p-4 flex flex-col items-center gap-3 text-center group cursor-pointer no-underline" style={{ color: "var(--text-primary)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${action.color}15`, border: `1px solid ${action.color}25` }}>
                  <action.icon size={22} style={{ color: action.color }} />
                </div>
                <span className="text-xs font-semibold">{action.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="card-elevated p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "var(--accent-gradient)" }} />
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-dim)" }}>
              <Zap size={24} style={{ color: "var(--accent-primary)" }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">Get Started with DriveVerse</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Add your first vehicle, connect DigiLocker for verified documents, and explore Astra AI — your intelligent mobility co-pilot.
              </p>
            </div>
            <Link href="/dashboard/vehicles" className="btn btn-primary text-sm flex-shrink-0">
              Add Vehicle
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
