"use client";

import { motion } from "framer-motion";
import { Shield, Clock, AlertTriangle, Plus, ExternalLink } from "lucide-react";

export default function InsurancePage() {
  const insurancePolicies: { id: string; provider: string; policy_number: string; expiry: string; vehicle: string; status: string }[] = [];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Insurance Center</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Manage your vehicle insurance policies and renewal reminders</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> Add Policy</button>
      </div>

      {/* Expiry Reminder Cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[{ days: 30, label: "30 Days", color: "var(--info)" }, { days: 15, label: "15 Days", color: "var(--warning)" }, { days: 7, label: "7 Days", color: "var(--error)" }].map((alert, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card p-4 text-center">
            <Clock size={20} className="mx-auto mb-2" style={{ color: alert.color }} />
            <div className="text-xs font-semibold uppercase" style={{ color: "var(--text-tertiary)" }}>Alert at</div>
            <div className="text-xl font-bold" style={{ color: alert.color }}>{alert.label}</div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>before expiry</div>
          </motion.div>
        ))}
      </div>

      {/* Policies */}
      {insurancePolicies.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated p-12 text-center">
          <Shield size={48} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <h3 className="text-lg font-bold mb-2">No insurance policies added</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Add your vehicle insurance details to track expiry and get renewal reminders.</p>
          <button className="btn btn-primary"><Plus size={16} /> Add Insurance Policy</button>
        </motion.div>
      ) : null}

      <div className="card p-4 flex items-start gap-3" style={{ background: "var(--info-dim)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Insurance data is entered manually or imported from DigiLocker when connected. DriveVerse sends alerts 30, 15, and 7 days before expiry.
        </div>
      </div>
    </div>
  );
}
