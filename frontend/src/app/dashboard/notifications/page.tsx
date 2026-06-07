"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, Filter } from "lucide-react";
import api from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  created_at: string;
}

const categoryIcons: Record<string, string> = {
  challan: "⚠️",
  insurance: "🛡️",
  puc: "🌿",
  vehicle: "🚗",
  document: "📄",
  security: "🔒",
  system: "⚙️",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.getNotifications().then((res) => {
      if (res.ok) {
        const data = res.data as { notifications: Notification[] };
        setNotifications(data.notifications);
      }
    });
  }, []);

  const markAllRead = async () => {
    await api.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = filter === "all"
    ? notifications
    : filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications.filter((n) => n.category === filter);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Notifications</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary text-sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1 p-1 rounded-lg overflow-x-auto" style={{ background: "var(--bg-tertiary)" }}>
        {[
          { value: "all", label: "All" },
          { value: "unread", label: "Unread" },
          { value: "challan", label: "⚠️ Challans" },
          { value: "insurance", label: "🛡️ Insurance" },
          { value: "vehicle", label: "🚗 Vehicles" },
          { value: "security", label: "🔒 Security" },
        ].map((opt) => (
          <button key={opt.value} onClick={() => setFilter(opt.value)} className="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap bg-transparent border-none cursor-pointer" style={{ background: filter === opt.value ? "var(--accent-dim)" : "transparent", color: filter === opt.value ? "var(--accent-primary)" : "var(--text-tertiary)" }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated p-12 text-center">
          <Bell size={48} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <h3 className="text-lg font-bold mb-2">No notifications</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            You&apos;ll receive alerts for challan updates, document expiry, insurance reminders, and security events.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif, i) => (
            <motion.div key={notif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="card p-4 flex items-start gap-4"
              style={{ opacity: notif.is_read ? 0.7 : 1 }}
            >
              <span className="text-xl mt-0.5">{categoryIcons[notif.category] || "🔔"}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm flex items-center gap-2">
                  {notif.title}
                  {!notif.is_read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--accent-primary)" }} />}
                </div>
                <div className="text-xs mt-1 truncate" style={{ color: "var(--text-secondary)" }}>{notif.message}</div>
                <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
