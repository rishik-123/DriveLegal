"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Filter, Clock, MapPin, CreditCard, ExternalLink, Search, X, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface Challan {
  id: string;
  challan_number: string;
  violation_date: string;
  location: string;
  violation_type: string;
  violation_section: string;
  amount: number;
  status: "pending" | "paid" | "under_review" | "dismissed";
}

const statusConfig = {
  pending: { label: "Pending", color: "var(--warning)", bg: "var(--warning-dim)" },
  paid: { label: "Paid", color: "var(--success)", bg: "var(--success-dim)" },
  under_review: { label: "Under Review", color: "var(--info)", bg: "var(--info-dim)" },
  dismissed: { label: "Dismissed", color: "var(--text-tertiary)", bg: "var(--bg-tertiary)" },
};

export default function ChallansPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showIframe, setShowIframe] = useState(false);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await api.getChallans();
      if (res.ok) {
        const data = res.data as { challans: Challan[] };
        setChallans(data.challans || []);
      }
    } catch (err) {
      console.error("Failed to fetch challans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  const handlePayChallan = async (challanId: string) => {
    try {
      const res = await api.payChallan(challanId);
      if (res.ok) {
        setShowIframe(true);
        fetchChallans();
      }
    } catch (err) {
      console.error("Failed to pay challan:", err);
    }
  };

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "under_review", label: "Under Review" },
  ];

  const filteredChallans = challans.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    if (searchQuery && !c.challan_number?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Challan Center</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            View, manage, and pay your traffic challans
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowIframe(true)}>
          <ExternalLink size={16} /> Check on e-Challan Portal
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}>
          <Search size={14} style={{ color: "var(--text-tertiary)" }} />
          <input type="text" placeholder="Search by challan number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm flex-1" style={{ color: "var(--text-primary)" }} />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
          {filterOptions.map((opt) => (
            <button key={opt.value} onClick={() => setFilter(opt.value)} className="px-3 py-1.5 rounded-md text-xs font-medium bg-transparent border-none cursor-pointer transition-all" style={{ background: filter === opt.value ? "var(--accent-dim)" : "transparent", color: filter === opt.value ? "var(--accent-primary)" : "var(--text-tertiary)" }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Challan List / Empty State */}
      {filteredChallans.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated p-12 text-center">
          <AlertTriangle size={48} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <h3 className="text-lg font-bold mb-2">No challans found</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Great news! You don&apos;t have any traffic challans on record.
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            You can check for new challans on the official e-Challan portal.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredChallans.map((challan, i) => {
            const statusCfg = statusConfig[challan.status];
            return (
              <motion.div key={challan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: statusCfg.bg }}>
                      <AlertTriangle size={18} style={{ color: statusCfg.color }} />
                    </div>
                    <div>
                      <div className="font-bold">{challan.violation_type}</div>
                      <div className="text-xs mt-1 space-y-0.5" style={{ color: "var(--text-secondary)" }}>
                        <div className="flex items-center gap-1"><Filter size={10} /> {challan.violation_section}</div>
                        <div className="flex items-center gap-1"><MapPin size={10} /> {challan.location}</div>
                        <div className="flex items-center gap-1"><Clock size={10} /> {challan.violation_date}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-bold">₹{challan.amount?.toLocaleString()}</div>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                    </div>
                    {challan.status === "pending" && (
                      <button 
                        className="btn btn-primary text-sm flex items-center gap-1.5"
                        onClick={() => handlePayChallan(challan.id)}
                      >
                        <CreditCard size={14} /> Pay Now
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Info Banner */}
      <div className="card p-4 flex items-start gap-3" style={{ background: "var(--info-dim)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--info)" }}>Integration Note</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            The official e-Challan API requires government partnership registration. Challan data is shown from manual entries and document scans. Visit{" "}
            <a href="https://echallan.parivahan.gov.in/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--info)" }}>echallan.parivahan.gov.in</a>{" "}for official records.
          </div>
        </div>
      </div>

      {/* e-Challan Iframe Modal */}
      {showIframe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl border overflow-hidden shadow-2xl" style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}>
            {/* Iframe Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>e-Challan Parivahan Portal</h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Official Government Traffic Challan Portal</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open("https://echallan.parivahan.gov.in/", "_blank")}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Open in New Tab
                </button>
                <button 
                  onClick={() => setShowIframe(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors border-none cursor-pointer"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {/* Iframe Content */}
            <div className="flex-1 bg-white relative">
              <iframe 
                src="https://echallan.parivahan.gov.in/" 
                className="w-full h-full border-none" 
                title="e-Challan Portal"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
