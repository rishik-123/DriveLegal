"use client";

import { motion } from "framer-motion";
import { Thermometer, Clock, Plus, AlertTriangle, Leaf } from "lucide-react";

export default function PUCPage() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">PUC Center</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Track Pollution Under Control certificates and expiry reminders</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> Add PUC</button>
      </div>

      {/* Status Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #22c55e, #10b981, #059669)" }} />
        <Leaf size={48} className="mx-auto mb-4" style={{ color: "#22c55e" }} />
        <h3 className="text-lg font-bold mb-2">No PUC Certificates Added</h3>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Add your vehicle&apos;s PUC certificate details to track validity and receive expiry reminders.
        </p>
        <button className="btn btn-primary"><Plus size={16} /> Add PUC Certificate</button>
      </motion.div>

      {/* Reminder Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Clock size={20} style={{ color: "var(--accent-primary)" }} />
            <div className="font-bold">Auto Reminders</div>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            DriveVerse will send you reminders before your PUC expires so you never miss a renewal.
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Thermometer size={20} style={{ color: "var(--success)" }} />
            <div className="font-bold">Electric Vehicles</div>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Electric vehicles are exempt from PUC requirements. EVs will automatically show &quot;N/A&quot; status.
          </p>
        </div>
      </div>

      <div className="card p-4 flex items-start gap-3" style={{ background: "var(--success-dim)", border: "1px solid rgba(34,197,94,0.2)" }}>
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
          PUC certificates are valid for 6 months. Under Section 190(2) of the Motor Vehicles Act, driving without a valid PUC can result in a fine of ₹10,000.
        </div>
      </div>
    </div>
  );
}
