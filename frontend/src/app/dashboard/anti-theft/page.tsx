"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, MapPin, Plus, Power, Trash2, AlertTriangle, X, Loader2 } from "lucide-react";

interface Geofence {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  is_active: boolean;
}

export default function AntiTheftPage() {
  const [geofences] = useState<Geofence[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Anti-Theft Center</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Geofencing, tamper detection, and vehicle security monitoring</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={16} /> Add Safe Zone</button>
      </div>

      {/* Security Status */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Security Status", value: "Active", icon: Shield, color: "var(--success)" },
          { label: "Safe Zones", value: `${geofences.length}`, icon: MapPin, color: "var(--accent-primary)" },
          { label: "Alerts Today", value: "0", icon: AlertTriangle, color: "var(--success)" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
              <stat.icon size={22} style={{ color: stat.color }} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase" style={{ color: "var(--text-tertiary)" }}>{stat.label}</div>
              <div className="text-xl font-bold">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Geofence List */}
      {geofences.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated p-12 text-center">
          <Shield size={48} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <h3 className="text-lg font-bold mb-2">No Safe Zones Created</h3>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Create geofence safe zones around your home, office, or parking areas. You&apos;ll receive instant alerts if your vehicle leaves the zone.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Create First Safe Zone
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {geofences.map((zone, i) => (
            <motion.div key={zone.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: zone.is_active ? "var(--success-dim)" : "var(--bg-tertiary)" }}>
                <MapPin size={18} style={{ color: zone.is_active ? "var(--success)" : "var(--text-tertiary)" }} />
              </div>
              <div className="flex-1">
                <div className="font-bold">{zone.name}</div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {zone.center_lat.toFixed(4)}°N, {zone.center_lng.toFixed(4)}°E • Radius: {zone.radius_meters}m
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost px-2 py-2" title={zone.is_active ? "Deactivate" : "Activate"}>
                  <Power size={14} style={{ color: zone.is_active ? "var(--success)" : "var(--text-tertiary)" }} />
                </button>
                <button className="btn btn-ghost px-2 py-2" title="Delete">
                  <Trash2 size={14} style={{ color: "var(--error)" }} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Features */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={20} style={{ color: "var(--accent-primary)" }} />
            <div className="font-bold">Geofencing</div>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Set virtual boundaries around safe locations. Get notified instantly when your vehicle crosses the perimeter.
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Shield size={20} style={{ color: "var(--error)" }} />
            <div className="font-bold">Tamper Detection</div>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Monitors for unusual movement patterns, ignition attempts, or location changes during off-hours.
          </p>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="card-elevated p-6 w-full max-w-md relative">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 bg-transparent border-none cursor-pointer" style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
              <h2 className="text-xl font-bold mb-1">Create Safe Zone</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Define a geofence boundary for your vehicle</p>

              <form className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Zone Name</label>
                  <input type="text" placeholder="e.g. Home Parking" className="input" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Latitude</label>
                    <input type="number" step="any" placeholder="19.0760" className="input" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Longitude</label>
                    <input type="number" step="any" placeholder="72.8777" className="input" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Radius (meters)</label>
                  <input type="number" min="100" max="5000" defaultValue={500} className="input" required />
                </div>
                <button type="submit" className="btn btn-primary w-full py-3">
                  <Plus size={16} /> Create Safe Zone
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
